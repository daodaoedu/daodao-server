#!/usr/bin/env python3
"""Offline synthetic archive: local trusted fixtures only; no network or deletion API."""
import argparse
import contextlib
import datetime
import fcntl
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import zlib


class ArchiveError(Exception):
    """A safe, bounded diagnostic code."""


def digest(data):
    """Return the compressed-byte SHA-256."""
    return hashlib.sha256(data).hexdigest()


def sync_dir(path):
    """Ask the local filesystem to sync a directory entry update."""
    fd = os.open(path, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def durable_mkdir(path):
    """Create each missing directory and sync its parent's new entry."""
    path = Path(path)
    if any(p.is_symlink() for p in [path, *path.parents]):
        raise ArchiveError('UNSAFE_ROOT')
    missing = []
    cursor = path
    while not cursor.exists():
        missing.append(cursor)
        cursor = cursor.parent
    if not cursor.is_dir():
        raise ArchiveError('UNSAFE_ROOT')
    for directory in reversed(missing):
        try:
            directory.mkdir()
        except FileExistsError:
            if directory.is_symlink() or not directory.is_dir():
                raise ArchiveError('UNSAFE_ROOT') from None
        sync_dir(directory.parent)


def atomic(path, data):
    """Publish a fully synced temporary file within the destination filesystem."""
    path = Path(path)
    fd, tmp = tempfile.mkstemp(prefix='.tmp-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(tmp, path)
        sync_dir(path.parent)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def encoded(value):
    """Encode stable compact JSON for disk and identity hashing."""
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def regular(path):
    """Reject symlinks in every component for trusted local fixture scope."""
    path = Path(os.path.abspath(path))
    if any(p.is_symlink() for p in [path, *path.parents]) or not path.is_file():
        raise ArchiveError('UNSAFE_FILE')
    return path


def read_json(path):
    """Read bounded object metadata, rejecting malformed or oversized inputs."""
    with regular(path).open('rb') as stream:
        data = stream.read(16385)
    if len(data) > 16384:
        raise ArchiveError('INVALID_METADATA')
    result = json.loads(data)
    if not isinstance(result, dict):
        raise ArchiveError('INVALID_METADATA')
    return result


def component(value):
    """Validate one safe logical identity component."""
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,64}', value):
        raise ArchiveError('INVALID_SCOPE')
    return value


class LocalStore:
    """Immutable put-if-absent local filesystem mock, with actual byte readback."""
    def __init__(self, root, max_bytes=1048576):
        """Use an already scoped local store root."""
        self.root = root
        self.max_bytes = max_bytes

    def put(self, key, data):
        """Publish bytes by hard-link without replacing an existing object."""
        dest = self.root / key
        if any(p.is_symlink() for p in [dest, *dest.parents]):
            raise ArchiveError('UNSAFE_FILE')
        durable_mkdir(dest.parent)
        fd, tmp = tempfile.mkstemp(prefix='.put-', dir=dest.parent)
        try:
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            try:
                os.link(tmp, dest)
            except FileExistsError:
                pass
            sync_dir(dest.parent)
        finally:
            os.unlink(tmp)

    def read(self, key):
        """Read actual object bytes; never trust a checksum response."""
        with regular(self.root / key).open('rb') as stream:
            return stream.read(self.max_bytes + 1)


class Archive:
    """Single-writer spool, committed captures, retryable delivery, ack-only cleanup."""
    def __init__(self, config_path, store=None):
        """Validate explicit source mapping and disjoint spool/store roots."""
        c = read_json(config_path)
        if not isinstance(c.get('sources'), dict) or not c['sources']:
            raise ArchiveError('INVALID_CONFIG')
        self.sources = {component(k): Path(os.path.abspath(v)) for k, v in c['sources'].items()}
        self.spool = Path(os.path.abspath(c['spool']))
        self.store_root = Path(os.path.abspath(c['store']))
        self.capacity = c['capacity_bytes']
        self.max_entries = c.get('max_entries', 1000)
        self.max_expanded = c.get('max_expanded_bytes', 1048576)
        if type(self.max_entries) is not int or self.max_entries <= 0:
            raise ArchiveError('INVALID_CONFIG')
        if type(self.capacity) is not int or self.capacity <= 0 or type(self.max_expanded) is not int or self.max_expanded <= 0:
            raise ArchiveError('INVALID_CONFIG')
        roots = [*self.sources.values(), self.spool, self.store_root]
        for root in roots:
            if any(p.is_symlink() for p in [root, *root.parents]):
                raise ArchiveError('UNSAFE_ROOT')
        if any(a == b or a in b.parents or b in a.parents for i, a in enumerate(roots) for b in roots[i + 1:]):
            raise ArchiveError('OVERLAPPING_ROOTS')
        durable_mkdir(self.spool)
        durable_mkdir(self.store_root)
        self.store = store or LocalStore(self.store_root, self.capacity)

    @contextlib.contextmanager
    def locked(self):
        """Hold a nonblocking process lock and reclaim uncommitted stages."""
        for root in [self.spool, self.store_root, *self.sources.values()]:
            if any(p.is_symlink() for p in [root, *root.parents]):
                raise ArchiveError('UNSAFE_ROOT')
        if (self.spool / '.lock').is_symlink():
            raise ArchiveError('UNSAFE_FILE')
        with (self.spool / '.lock').open('a+b') as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise ArchiveError('BUSY') from None
            try:
                for stage in self.spool.glob('.capture-*'):
                    if stage.is_symlink() or not stage.is_dir():
                        raise ArchiveError('UNSAFE_FILE')
                    shutil.rmtree(stage)
                for entry in self.entries():
                    for temp in entry.glob('.tmp-*'):
                        regular(temp).unlink()
                yield
            finally:
                fcntl.flock(lock, fcntl.LOCK_UN)

    def entries(self):
        """List committed identities while rejecting redirected entries."""
        entries = []
        for p in self.spool.iterdir():
            if re.fullmatch(r'[0-9a-f]{64}', p.name):
                if p.is_symlink() or not p.is_dir():
                    raise ArchiveError('UNSAFE_FILE')
                entries.append(p)
        return sorted(entries)

    def load_entry(self, entry):
        """Fail closed on corrupt or redirected committed metadata."""
        if entry.is_symlink() or not entry.is_dir():
            raise ArchiveError('UNSAFE_FILE')
        try:
            m = read_json(entry / 'manifest.json')
            state = read_json(entry / 'state.json')
            identity = {k: m[k] for k in ['env', 'service', 'date', 'artifact_id']}
            for field in ['env', 'service', 'artifact_id']:
                component(m[field])
            datetime.date.fromisoformat(m['date'])
            expected = f'{m["env"]}/{m["service"]}/{m["date"]}/{m["artifact_id"]}/{m["sha256"]}.jsonl.gz'
            if (type(m.get('version')) is not int or m['version'] != 1
                    or m['spool_id'] != entry.name or digest(encoded(identity)) != entry.name
                    or not re.fullmatch('[0-9a-f]{64}', m['sha256']) or m['object_key'] != expected
                    or type(m['compressed_bytes']) is not int or m['compressed_bytes'] < 1
                    or state['status'] not in ['pending', 'acked']
                    or type(state['attempts']) is not int or not 0 <= state['attempts'] <= 2147483647
                    or state['error_code'] not in [None, 'INTERRUPTED', 'SPOOL_CHECKSUM', 'READBACK_CHECKSUM', 'STORE_IO', 'UNSAFE_FILE', 'UNSAFE_ROOT']
                    or (state['last_success'] is not None and (not isinstance(state['last_success'], str) or len(state['last_success']) > 64))
                    or (state['status'] == 'acked' and (state['last_success'] is None or state['error_code'] is not None or state['attempts'] < 1))
                    or (state['status'] == 'pending' and state['last_success'] is not None)):
                raise ValueError()
            if state['last_success'] is not None and datetime.datetime.fromisoformat(state['last_success']).tzinfo is None:
                raise ValueError()
            if state['status'] == 'pending' or (entry / 'blob.gz').exists() or (entry / 'blob.gz').is_symlink():
                regular(entry / 'blob.gz')
            return m, state
        except ArchiveError:
            raise
        except (KeyError, ValueError, TypeError, OSError):
            raise ArchiveError('CORRUPT_SPOOL') from None

    def capture(self, manifest_path):
        """Validate a completed synthetic gzip and atomically commit its spool copy."""
        with self.locked():
            m = read_json(manifest_path)
            if type(m.get('version')) is not int or m.get('version') != 1 or m.get('completed') is not True:
                raise ArchiveError('INCOMPLETE')
            env, service = component(m.get('env')), component(m.get('service'))
            if env not in self.sources:
                raise ArchiveError('UNKNOWN_ENV')
            date = m.get('date')
            try:
                if datetime.date.fromisoformat(date).isoformat() != date:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ArchiveError('INVALID_DATE') from None
            relative = m.get('source')
            if not isinstance(relative, str) or not relative.endswith('.jsonl.gz') or Path(relative).is_absolute() or '..' in Path(relative).parts or not relative or len(relative) > 1024 or '\\' in relative:
                raise ArchiveError('INVALID_SOURCE')
            source = regular(self.sources[env] / relative)
            if source.stat().st_size > self.capacity:
                raise ArchiveError('SPOOL_CAPACITY')
            with source.open('rb') as stream:
                data = stream.read(self.capacity + 1)
            if len(data) > self.capacity:
                raise ArchiveError('SPOOL_CAPACITY')
            if type(m.get('compressed_bytes')) is not int or len(data) != m['compressed_bytes'] or digest(data) != m.get('sha256'):
                raise ArchiveError('SOURCE_CHECKSUM')
            try:
                with gzip.GzipFile(fileobj=io.BytesIO(data), mode='rb') as stream:
                    raw = stream.read(self.max_expanded + 1)
                if len(raw) > self.max_expanded:
                    raise ArchiveError('EXPANDED_CAPACITY')
                records = [json.loads(line) for line in raw.decode('utf-8').splitlines()]
                if not records:
                    raise ValueError()
                for r in records:
                    if not isinstance(r, dict) or r.get('env') != env or r.get('service') != service or r.get('level') not in ['debug', 'info', 'warn', 'error'] or not isinstance(r.get('message'), str) or not isinstance(r.get('timestamp'), str):
                        raise ValueError()
                    stamp = datetime.datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00'))
                    if stamp.tzinfo is None or stamp.date().isoformat() != date:
                        raise ValueError()
            except ArchiveError:
                raise
            except (ValueError, OSError, EOFError, UnicodeError, TypeError, zlib.error):
                raise ArchiveError('INVALID_GZIP_RECORDS') from None
            producer_id = component(m.get('artifact_id'))
            identity = dict(env=env, service=service, date=date, artifact_id=producer_id)
            artifact = digest(encoded(identity))
            dest = self.spool / artifact
            if dest.exists() or dest.is_symlink():
                existing, state = self.load_entry(dest)
                if existing['sha256'] != m['sha256'] or existing['compressed_bytes'] != len(data):
                    raise ArchiveError('IDENTITY_CONFLICT')
                if (dest / 'blob.gz').exists():
                    with regular(dest / 'blob.gz').open('rb') as stream:
                        saved = stream.read(existing['compressed_bytes'] + 1)
                    if digest(saved) != existing['sha256'] or len(saved) != existing['compressed_bytes']:
                        raise ArchiveError('SPOOL_CHECKSUM')
                return artifact
            entries = self.entries()
            for entry in entries:
                self.load_entry(entry)
            used = sum((entry / 'blob.gz').stat().st_size for entry in entries if (entry / 'blob.gz').exists())
            if len(entries) >= self.max_entries or used + len(data) > self.capacity:
                raise ArchiveError('SPOOL_CAPACITY')
            m = dict(identity, source=relative, sha256=m['sha256'], version=1,
                     compressed_bytes=len(data), spool_id=artifact,
                     object_key=f'{env}/{service}/{date}/{producer_id}/{m["sha256"]}.jsonl.gz')
            state = dict(status='pending', attempts=0, error_code=None, last_success=None)
            tmp = Path(tempfile.mkdtemp(prefix='.capture-', dir=self.spool))
            try:
                atomic(tmp / 'blob.gz', data)
                atomic(tmp / 'manifest.json', encoded(m))
                atomic(tmp / 'state.json', encoded(state))
                os.rename(tmp, dest)
                sync_dir(self.spool)
            finally:
                if tmp.exists():
                    shutil.rmtree(tmp)
            return artifact

    def retry(self, after_put=None):
        """Deliver pending bytes and commit ack only after actual size/hash readback."""
        with self.locked():
            for entry in self.entries():
                m, state = self.load_entry(entry)
                if state['status'] == 'acked':
                    continue
                state['attempts'] = min(state['attempts'] + 1, 2147483647)
                state['error_code'] = 'INTERRUPTED'
                atomic(entry / 'state.json', encoded(state))
                try:
                    with regular(entry / 'blob.gz').open('rb') as stream:
                        data = stream.read(m['compressed_bytes'] + 1)
                    if len(data) != m['compressed_bytes'] or digest(data) != m['sha256']:
                        raise ArchiveError('SPOOL_CHECKSUM')
                    self.store.put(m['object_key'], data)
                    if after_put:
                        after_put()
                    readback = self.store.read(m['object_key'])
                    if len(readback) != m['compressed_bytes'] or digest(readback) != m['sha256']:
                        raise ArchiveError('READBACK_CHECKSUM')
                    state.update(status='acked', error_code=None, last_success=datetime.datetime.now(datetime.timezone.utc).isoformat())
                except ArchiveError as error:
                    state['error_code'] = str(error)
                except OSError:
                    state['error_code'] = 'STORE_IO'
                atomic(entry / 'state.json', encoded(state))
        return self.status()

    def status(self):
        """Report bounded aggregate diagnostics without raw exception details."""
        with self.locked():
            states = [self.load_entry(p)[1] for p in self.entries()]
            return dict(pending=sum(s['status'] == 'pending' for s in states), acked=sum(s['status'] == 'acked' for s in states),
                        attempts=sum(s['attempts'] for s in states), error_codes=sorted({s['error_code'] for s in states if s['error_code']}),
                        last_success=max((s['last_success'] for s in states if s['last_success']), default=None))

    def cleanup(self):
        """Remove only acked local blobs after rechecking their archive object."""
        with self.locked():
            removed = 0
            for entry in self.entries():
                m, state = self.load_entry(entry)
                if state['status'] == 'acked':
                    # Keep durable acknowledgement/identity metadata for repeat capture.
                    blob = entry / 'blob.gz'
                    if blob.exists():
                        regular(blob)
                        data = self.store.read(m['object_key'])
                        if len(data) != m['compressed_bytes'] or digest(data) != m['sha256']:
                            raise ArchiveError('READBACK_CHECKSUM')
                        blob.unlink()
                        sync_dir(entry)
                        removed += 1
            return {'removed_acked_blobs': removed}


def demo(root):
    """Create synthetic completed producer fixtures; refuses an existing root."""
    root = Path(root).resolve()
    root.mkdir(parents=True, exist_ok=False)
    source = root / 'sources-dev'
    source.mkdir()
    records = [dict(timestamp='2026-11-08T00:00:00Z', level='info', message=f'synthetic-{i}', env='dev', service='api') for i in range(3)]
    data = gzip.compress(b'\n'.join(encoded(r) for r in records) + b'\n', mtime=0)
    (source / 'demo.jsonl.gz').write_bytes(data)
    manifest = dict(version=1, artifact_id='chunk-001', completed=True, env='dev', service='api', date='2026-11-08', source='demo.jsonl.gz', sha256=digest(data), compressed_bytes=len(data))
    (root / 'completed.json').write_bytes(encoded(manifest))
    config = dict(sources={'dev': str(source)}, spool=str(root / 'spool'), store=str(root / 'store'), capacity_bytes=1048576)
    (root / 'config.json').write_bytes(encoded(config))
    return {'config': str(root / 'config.json'), 'manifest': str(root / 'completed.json'), 'records': 3}


def main():
    """Run an explicit local command and return safe JSON diagnostics."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('demo').add_argument('root')
    sub.add_parser('capture').add_argument('manifest')
    for name in ['retry', 'status', 'cleanup']:
        sub.add_parser(name)
    args = parser.parse_args()
    try:
        if args.command == 'demo':
            result = demo(args.root)
        else:
            if not args.config:
                parser.error('--config is required')
            archive = Archive(args.config)
            result = {'spool_id': archive.capture(args.manifest)} if args.command == 'capture' else getattr(archive, args.command)()
        print(json.dumps(result, sort_keys=True))
        return 1 if args.command == 'retry' and result['pending'] else 0
    except (ArchiveError, OSError, ValueError, KeyError, TypeError):
        code = sys.exc_info()[1]
        print(json.dumps({'error_code': str(code) if isinstance(code, ArchiveError) else 'INVALID_INPUT_OR_IO'}))
        return 2


if __name__ == '__main__':
    sys.exit(main())
