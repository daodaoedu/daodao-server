"""Behavioral tests over real gzip, filesystem objects, and fresh processes."""
import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'archive.py'
spec = importlib.util.spec_from_file_location('archive', SCRIPT)
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name).resolve() / 'fixture'
        result = a.demo(self.root)
        self.config = Path(result['config'])
        self.manifest = Path(result['manifest'])
        self.archive = a.Archive(self.config)

    def tearDown(self):
        self.tmp.cleanup()

    def change_manifest(self, **values):
        m = json.loads(self.manifest.read_text())
        m.update(values)
        self.manifest.write_text(json.dumps(m))

    def capture(self):
        return self.archive.capture(self.manifest)

    def object(self):
        return next((self.root / 'store').rglob('*.gz'))

    def test_verified_ack_and_cleanup_retains_archive_and_identity(self):
        artifact = self.capture()
        self.assertEqual(self.archive.cleanup(), {'removed_acked_blobs': 0})
        self.assertTrue((self.root / 'spool' / artifact / 'blob.gz').exists())
        result = self.archive.retry()
        self.assertEqual((result['pending'], result['acked'], result['attempts']), (0, 1, 1))
        self.assertIsNotNone(result['last_success'])
        original = (self.root / 'sources-dev/demo.jsonl.gz').read_bytes()
        self.assertEqual(self.object().read_bytes(), original)
        self.assertIn(a.digest(original), str(self.object()))
        self.assertEqual(self.archive.cleanup(), {'removed_acked_blobs': 1})
        self.assertEqual(self.object().read_bytes(), original)
        self.assertEqual(self.capture(), artifact)
        self.assertEqual(self.archive.status()['acked'], 1)

    def test_source_removed_after_capture_retry_survives(self):
        self.capture()
        (self.root / 'sources-dev/demo.jsonl.gz').unlink()
        self.assertEqual(a.Archive(self.config).retry()['acked'], 1)
        self.assertEqual(len(gzip.decompress(self.object().read_bytes()).splitlines()), 3)

    def test_repeat_and_equal_content_separate_source(self):
        first = self.capture()
        self.assertEqual(self.capture(), first)
        src = self.root / 'sources-dev'
        (src / 'second.jsonl.gz').write_bytes((src / 'demo.jsonl.gz').read_bytes())
        self.change_manifest(source='second.jsonl.gz', artifact_id='chunk-002')
        second = self.capture()
        self.assertNotEqual(first, second)
        self.assertEqual(self.archive.retry()['acked'], 2)
        self.assertEqual(len(list((self.root / 'store').rglob('*.gz'))), 2)

    def test_invalid_manifest_scopes_and_completion(self):
        for values in [dict(completed=False), dict(env='prod'), dict(service='../api'), dict(date='2026-02-30'), dict(source='../demo.jsonl.gz'), dict(source='/tmp/a.jsonl.gz'), dict(source='x.txt')]:
            with self.subTest(values=values):
                original = self.manifest.read_text()
                self.change_manifest(**values)
                with self.assertRaises(a.ArchiveError):
                    self.capture()
                self.manifest.write_text(original)
        self.assertEqual(self.archive.status()['pending'], 0)
        self.assertEqual(list((self.root / 'store').iterdir()), [])

    def test_checksum_partial_gzip_and_invalid_record_rejected(self):
        src = self.root / 'sources-dev/demo.jsonl.gz'
        original = src.read_bytes()
        for data, update_checksum in [(original[:-3], False), (original[:-3], True), (gzip.compress(b'{"message":"missing fields"}\n'), True), (gzip.compress(b'not-json\n'), True)]:
            with self.subTest(length=len(data)):
                src.write_bytes(data)
                if update_checksum:
                    self.change_manifest(sha256=a.digest(data), compressed_bytes=len(data))
                with self.assertRaises(a.ArchiveError):
                    self.capture()
        self.assertEqual(self.archive.status()['pending'], 0)

    def test_cross_environment_record_rejected(self):
        src = self.root / 'sources-dev/demo.jsonl.gz'
        data = gzip.compress(gzip.decompress(src.read_bytes()).replace(b'"dev"', b'"prod"'))
        src.write_bytes(data)
        self.change_manifest(sha256=a.digest(data), compressed_bytes=len(data))
        with self.assertRaisesRegex(a.ArchiveError, 'INVALID_GZIP_RECORDS'):
            self.capture()

    def test_symlink_source_and_roots_rejected(self):
        src = self.root / 'sources-dev/demo.jsonl.gz'
        target = self.root / 'outside.gz'
        src.rename(target)
        src.symlink_to(target)
        with self.assertRaisesRegex(a.ArchiveError, 'UNSAFE_FILE'):
            self.capture()
        c = json.loads(self.config.read_text())
        c['store'] = c['spool'] + '/nested'
        self.config.write_text(json.dumps(c))
        with self.assertRaisesRegex(a.ArchiveError, 'OVERLAPPING_ROOTS'):
            a.Archive(self.config)

    def test_capacity_preserves_source_and_pending(self):
        original = (self.root / 'sources-dev/demo.jsonl.gz').read_bytes()
        c = json.loads(self.config.read_text())
        c['capacity_bytes'] = 1
        self.config.write_text(json.dumps(c))
        with self.assertRaisesRegex(a.ArchiveError, 'SPOOL_CAPACITY'):
            a.Archive(self.config).capture(self.manifest)
        self.assertEqual((self.root / 'sources-dev/demo.jsonl.gz').read_bytes(), original)
        self.assertEqual(self.archive.status()['pending'], 0)

    def test_put_failure_no_ack_then_retry(self):
        self.capture()
        class Failing(a.LocalStore):
            def put(self, key, data):
                raise OSError('sensitive secret never surfaced')
        failing = a.Archive(self.config, Failing(self.root / 'store'))
        self.assertEqual(failing.retry()['error_codes'], ['STORE_IO'])
        self.assertEqual(failing.status()['pending'], 1)
        self.assertEqual(failing.cleanup()['removed_acked_blobs'], 0)
        self.assertEqual(self.archive.retry()['acked'], 1)

    def test_read_failure_and_corrupt_object_cannot_ack_or_overwrite(self):
        self.capture()
        class FailRead(a.LocalStore):
            def read(self, key):
                raise OSError('private detail')
        self.assertEqual(a.Archive(self.config, FailRead(self.root / 'store')).retry()['pending'], 1)
        self.object().write_bytes(b'corrupt remote bytes')
        self.assertEqual(self.archive.retry()['error_codes'], ['READBACK_CHECKSUM'])
        self.assertEqual(self.object().read_bytes(), b'corrupt remote bytes')
        self.assertEqual(self.archive.cleanup()['removed_acked_blobs'], 0)

    def test_corrupt_spool_no_store_put(self):
        artifact = self.capture()
        (self.root / 'spool' / artifact / 'blob.gz').write_bytes(b'partial')
        self.assertEqual(self.archive.retry()['error_codes'], ['SPOOL_CHECKSUM'])
        self.assertEqual(list((self.root / 'store').rglob('*.gz')), [])

    def test_actual_process_crash_after_put_fresh_process_reconciles(self):
        self.capture()
        code = "import sys,os;sys.path.insert(0,sys.argv[1]);from archive import Archive;Archive(sys.argv[2]).retry(after_put=lambda:os._exit(73))"
        p = subprocess.run([sys.executable, '-c', code, str(SCRIPT.parent), str(self.config)], capture_output=True)
        self.assertEqual(p.returncode, 73)
        obj = self.object()
        inode, contents = obj.stat().st_ino, obj.read_bytes()
        self.assertEqual(self.archive.status()['pending'], 1)
        p = subprocess.run([sys.executable, str(SCRIPT), '--config', str(self.config), 'retry'], capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stdout)
        self.assertEqual(json.loads(p.stdout)['acked'], 1)
        self.assertEqual(obj.stat().st_ino, inode)
        self.assertEqual(obj.read_bytes(), contents)
        self.assertEqual(len(list((self.root / 'store').rglob('*.gz'))), 1)

    def test_process_lock_rejects_second_writer(self):
        with self.archive.locked():
            p = subprocess.run([sys.executable, str(SCRIPT), '--config', str(self.config), 'capture', str(self.manifest)], capture_output=True, text=True)
        self.assertEqual(p.returncode, 2)
        self.assertEqual(json.loads(p.stdout), {'error_code': 'BUSY'})
        self.assertEqual(self.archive.status()['pending'], 0)

    def test_bounded_expansion(self):
        c = json.loads(self.config.read_text())
        c['max_expanded_bytes'] = 1
        self.config.write_text(json.dumps(c))
        with self.assertRaisesRegex(a.ArchiveError, 'EXPANDED_CAPACITY'):
            a.Archive(self.config).capture(self.manifest)

    def test_identity_conflict_does_not_modify_committed_artifact(self):
        artifact = self.capture()
        blob = self.root / 'spool' / artifact / 'blob.gz'
        original = blob.read_bytes()
        src = self.root / 'sources-dev/demo.jsonl.gz'
        data = gzip.compress(gzip.decompress(original).replace(b'synthetic-0', b'other-event'))
        src.write_bytes(data)
        self.change_manifest(sha256=a.digest(data), compressed_bytes=len(data))
        with self.assertRaisesRegex(a.ArchiveError, 'IDENTITY_CONFLICT'):
            self.capture()
        self.assertEqual(blob.read_bytes(), original)
        self.assertEqual(self.archive.retry()['acked'], 1)
        self.assertEqual(self.object().read_bytes(), original)

    def test_symlink_nested_store_cannot_write_outside(self):
        self.capture()
        outside = self.root / 'outside'
        outside.mkdir()
        (self.root / 'store/dev').symlink_to(outside, target_is_directory=True)
        self.assertEqual(self.archive.retry()['error_codes'], ['UNSAFE_FILE'])
        self.assertEqual(list(outside.iterdir()), [])

    def test_symlink_lock_entry_and_blob_rejected(self):
        artifact = self.capture()
        entry = self.root / 'spool' / artifact
        blob = entry / 'blob.gz'
        original = blob.read_bytes()
        target = self.root / 'outside.gz'
        target.write_bytes(original)
        blob.unlink()
        blob.symlink_to(target)
        with self.assertRaisesRegex(a.ArchiveError, 'UNSAFE_FILE'):
            self.archive.status()
        blob.unlink()
        blob.write_bytes(original)
        lock = self.root / 'spool/.lock'
        lock.unlink()
        lock.symlink_to(target)
        with self.assertRaisesRegex(a.ArchiveError, 'UNSAFE_FILE'):
            self.archive.cleanup()
        self.assertEqual(target.read_bytes(), original)
        lock.unlink()
        moved = self.root / 'moved'
        entry.rename(moved)
        entry.symlink_to(moved, target_is_directory=True)
        with self.assertRaisesRegex(a.ArchiveError, 'UNSAFE_FILE'):
            self.archive.status()

    def test_corrupt_committed_state_fails_closed_for_repeat_capture(self):
        artifact = self.capture()
        state = self.root / 'spool' / artifact / 'state.json'
        state.write_text('{"status":"acked"}')
        with self.assertRaisesRegex(a.ArchiveError, 'CORRUPT_SPOOL'):
            self.capture()
        self.assertTrue((state.parent / 'blob.gz').exists())

    def test_cleanup_preserves_last_copy_if_store_corrupted(self):
        artifact = self.capture()
        self.archive.retry()
        self.object().write_bytes(b'changed')
        with self.assertRaisesRegex(a.ArchiveError, 'READBACK_CHECKSUM'):
            self.archive.cleanup()
        self.assertTrue((self.root / 'spool' / artifact / 'blob.gz').exists())

    def test_max_entries_retained_after_cleanup(self):
        c = json.loads(self.config.read_text())
        c['max_entries'] = 1
        self.config.write_text(json.dumps(c))
        self.capture()
        self.archive.retry()
        self.archive.cleanup()
        self.change_manifest(artifact_id='chunk-002')
        with self.assertRaisesRegex(a.ArchiveError, 'SPOOL_CAPACITY'):
            a.Archive(self.config).capture(self.manifest)

    def test_partial_capture_child_exit_not_reported_enqueued(self):
        code = "import sys,os;sys.path.insert(0,sys.argv[1]);import archive;a=archive.Archive(sys.argv[2]);original=archive.atomic;count=0\ndef partial(path,data):\n global count\n original(path,data);count+=1\n if count==1:os._exit(74)\narchive.atomic=partial;a.capture(sys.argv[3])"
        p = subprocess.run([sys.executable, '-c', code, str(SCRIPT.parent), str(self.config), str(self.manifest)], capture_output=True)
        self.assertEqual(p.returncode, 74, p.stderr)
        self.assertEqual(self.archive.status()['pending'], 0)
        self.assertEqual(list((self.root / 'spool').glob('.capture-*')), [])
        self.capture()
        self.assertEqual(self.archive.retry()['acked'], 1)

    def test_failed_retry_cli_nonzero_safe_status(self):
        self.capture()
        (self.root / 'store/dev').write_bytes(b'block directory creation')
        p = subprocess.run([sys.executable, str(SCRIPT), '--config', str(self.config), 'retry'], capture_output=True, text=True)
        self.assertEqual(p.returncode, 1)
        result = json.loads(p.stdout)
        self.assertEqual(result['pending'], 1)
        self.assertEqual(result['error_codes'], ['UNSAFE_ROOT'])
        self.assertEqual(p.stderr, '')

    def test_metadata_type_boolean_version_and_root_alias_rejected(self):
        self.change_manifest(version=True)
        with self.assertRaisesRegex(a.ArchiveError, 'INCOMPLETE'):
            self.capture()
        self.manifest.write_text('[]')
        p = subprocess.run([sys.executable, str(SCRIPT), '--config', str(self.config), 'capture', str(self.manifest)], capture_output=True, text=True)
        self.assertEqual(p.returncode, 2)
        self.assertEqual(json.loads(p.stdout), {'error_code': 'INVALID_METADATA'})
        c = json.loads(self.config.read_text())
        c['store'] = str(self.root / 'spool/../spool')
        self.config.write_text(json.dumps(c))
        with self.assertRaisesRegex(a.ArchiveError, 'OVERLAPPING_ROOTS'):
            a.Archive(self.config)

    def test_put_publish_failure_leaves_no_partial_object_and_retries(self):
        self.capture()
        with patch.object(a.os, 'link', side_effect=OSError('simulated publish failure')):
            self.assertEqual(self.archive.retry()['error_codes'], ['STORE_IO'])
        self.assertEqual(list((self.root / 'store').rglob('*.gz')), [])
        self.assertEqual(list((self.root / 'store').rglob('.put-*')), [])
        self.assertEqual(self.archive.retry()['acked'], 1)
        self.assertEqual(len(gzip.decompress(self.object().read_bytes()).splitlines()), 3)

    def test_ack_write_failure_retains_pending_and_fresh_process_retries(self):
        artifact = self.capture()
        original_atomic = a.atomic
        def fail_ack(path, data):
            """Fail only the final acknowledgement persistence boundary."""
            if path.name == 'state.json' and json.loads(data)['status'] == 'acked':
                raise OSError('simulated ack write failure')
            original_atomic(path, data)
        with patch.object(a, 'atomic', side_effect=fail_ack):
            with self.assertRaises(OSError):
                self.archive.retry()
        self.assertEqual(self.archive.status()['pending'], 1)
        self.assertTrue((self.root / 'spool' / artifact / 'blob.gz').exists())
        obj = self.object()
        inode = obj.stat().st_ino
        p = subprocess.run([sys.executable, '-B', str(SCRIPT), '--config', str(self.config), 'retry'], capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stdout)
        self.assertEqual(json.loads(p.stdout)['acked'], 1)
        self.assertEqual(obj.stat().st_ino, inode)


if __name__ == '__main__':
    unittest.main()
