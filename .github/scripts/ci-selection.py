#!/usr/bin/env python3
"""Select PR CI work before services or dependency installation begin.

Only explicitly isolated changes can omit OAuth. Organization routes eagerly load
cohort/practice/user/resource services; generic runtime changes therefore keep it.
Non-PR callers (including CD's push event) always execute the complete pipeline.
"""
import argparse
from pathlib import Path, PurePosixPath
import re
import subprocess

KEYS = ('backend', 'oauth', 'schema', 'workflows')
# These standalone routers are not imported by the OAuth integration app.
ISOLATED = {
    'src/routes/monitor.routes.ts', 'src/routes/db-info.routes.ts',
    'public/monitor.html', 'openapi.json', 'openapi.yaml', 'generated/openapi-types.ts',
}


def select(paths):
    """Combine conservative requirements for repository-relative changed paths."""
    plan = dict.fromkeys(KEYS, False)
    for path in paths:
        if not path or path.startswith(('/', './')) or '..' in PurePosixPath(path).parts:
            raise ValueError('Changed paths must be nonempty repository-relative paths')
        required = set()
        if ((path.endswith(('.md', '.MD')) and not path.startswith(('src/', 'tests/', 'public/')))
                or (path.startswith('docs/') and path.endswith(('.rst', '.txt')))
                or path in {'LICENSE', 'LICENSE.txt'}):
            pass
        elif path == '.schema-drift-ignore.json':
            required = {'schema'}
        elif path == 'src/scripts/check-schema-drift.ts':
            required = {'backend', 'schema'}
        elif path.startswith('prisma/'):
            required = {'backend', 'oauth', 'schema'}
        elif path.startswith(('tests/integration/auth/', 'src/services/auth/')):
            required = {'backend', 'oauth'}
        elif path in ISOLATED:
            required = {'backend'}
        elif (path.startswith(('src/', 'tests/')) and path.endswith(('.test.ts', '.spec.ts'))):
            # A test case is not runtime code; keep the full backend suite.
            # Integration OAuth helpers/config are handled above or conservatively below.
            required = {'backend'}
        elif path.startswith('src/') and path.endswith('.ts'):
            required = {'backend', 'oauth'}
        elif path.startswith('tests/') and path.endswith(('.ts', '.cjs', '.js')):
            required = {'backend', 'oauth'}
        else:
            # Unknown executable/config, package/lock or CI changes must not escape.
            required = set(KEYS)
        for key in required:
            plan[key] = True
    return plan


def changed_paths(repo, base, head):
    """Read the complete PR diff; disable rename folding to keep both paths."""
    if not all(re.fullmatch(r'[0-9a-f]{40}', ref) for ref in (base, head)):
        raise ValueError('PR base and head must be full immutable commit SHAs')
    merge_base = subprocess.check_output(['git', '-C', str(repo), 'merge-base', base, head], text=True).strip()
    raw = subprocess.check_output([
        'git', '-C', str(repo), 'diff', '--no-ext-diff', '--no-renames',
        '--name-only', '-z', merge_base, head, '--',
    ])
    return [path.decode('utf-8', errors='surrogateescape') for path in raw.split(b'\0') if path]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--event', required=True)
    parser.add_argument('--base', default='')
    parser.add_argument('--head', default='')
    args = parser.parse_args()
    plan = (select(changed_paths(Path.cwd(), args.base, args.head))
            if args.event == 'pull_request' else dict.fromkeys(KEYS, True))
    # Print only after the complete diff was read and validated: no partial outputs.
    print('\n'.join(f'{key}={str(plan[key]).lower()}' for key in KEYS))


if __name__ == '__main__':
    main()
