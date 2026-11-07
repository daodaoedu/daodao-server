"""Execution-policy regressions: selection must never bypass required work."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / '.github/scripts/ci-selection.py'


def load_policy():
    spec = importlib.util.spec_from_file_location('ci_selection', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SelectionTests(unittest.TestCase):
    def setUp(self):
        self.policy = load_policy()

    def selected(self, paths):
        return self.policy.select(paths)

    def test_docs_only_and_empty_diff_have_no_heavy_work(self):
        for paths in ([], ['README.md', 'docs/security/history.md']):
            self.assertEqual(self.selected(paths), dict.fromkeys(['backend', 'oauth', 'schema', 'workflows'], False))

    def test_monitor_keeps_full_backend_and_auth_regression_without_unrelated_suites(self):
        self.assertEqual(self.selected(['src/routes/monitor.routes.ts', 'src/routes/__tests__/monitor-auth.test.ts', 'public/monitor.html', 'openapi.json', 'openapi.yaml', 'generated/openapi-types.ts']), {
            'backend': True, 'oauth': False, 'schema': False, 'workflows': False})

    def test_shared_runtime_and_oauth_dependencies_remain_conservative(self):
        for path in ['src/middleware/auth.ts', 'src/services/auth/oauth.service.ts',
                     'src/services/email/email.service.ts', 'src/queues/email.queue.ts',
                     'src/services/organization-invitation.service.ts', 'src/services/practice.service.ts',
                     'src/services/logging/logger.service.ts', 'src/utils/sanitize.ts',
                     'tests/integration/auth/__tests__/organization-owner.oauth.integration.ts']:
            with self.subTest(path=path):
                self.assertTrue(self.selected([path])['backend'])
                self.assertTrue(self.selected([path])['oauth'])

    def test_schema_checker_and_ignore_changes_select_schema(self):
        for path in ['prisma/schema.prisma', '.schema-drift-ignore.json', 'src/scripts/check-schema-drift.ts']:
            self.assertTrue(self.selected([path])['schema'], path)
        self.assertEqual(self.selected(['.schema-drift-ignore.json']), {
            'backend': False, 'oauth': False, 'schema': True, 'workflows': False})

    def test_non_oauth_test_case_keeps_backend(self):
        plan = self.selected(['src/services/__tests__/cohort-schedule.test.ts'])
        self.assertTrue(plan['backend'])
        self.assertFalse(plan['oauth'])
        self.assertTrue(self.selected(['tests/integration/auth/__tests__/oauth-environment.test.ts'])['oauth'])

    def test_unknown_dependency_and_ci_changes_select_full(self):
        for path in ['package.json', 'pnpm-lock.yaml', 'future/new-executable.js',
                     '.github/scripts/ci-selection.py', '.github/workflows/schema-drift.yml',
                     'docs/executable.py', 'new.config.js', 'public/robots.txt',
                     'src/config/new-runtime.txt', 'src/templates/new-runtime.md']:
            self.assertTrue(all(self.selected([path]).values()), path)

    def test_mixed_paths_combine_requirements(self):
        self.assertEqual(self.selected(['docs/ci.md', 'public/monitor.html', '.schema-drift-ignore.json']), {
            'backend': True, 'oauth': False, 'schema': True, 'workflows': False})

    def test_invalid_paths_fail_instead_of_ignoring_them(self):
        for path in ['/tmp/foo.md', '../README.md', '', './README.md']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                self.selected([path])

    def test_git_diff_retains_deleted_and_both_renamed_paths_without_file_limit(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            def git(*args):
                return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()
            git('init', '-q'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'test')
            (repo / 'src').mkdir(); (repo / 'src/oauth.ts').write_text('original')
            (repo / 'old.ts').write_text('removed')
            git('add', '.'); git('commit', '-qm', 'base'); base = git('rev-parse', 'HEAD')
            (repo / 'src/oauth.ts').rename(repo / 'README.md'); (repo / 'old.ts').unlink()
            for i in range(350): (repo / f'doc-{i}.md').write_text(str(i))
            git('add', '-A'); git('commit', '-qm', 'head'); head = git('rev-parse', 'HEAD')
            paths = self.policy.changed_paths(repo, base, head)
            self.assertEqual(len(paths), 353)
            self.assertIn('src/oauth.ts', paths); self.assertIn('README.md', paths); self.assertIn('old.ts', paths)
            self.assertTrue(self.selected(paths)['oauth'])
            with self.assertRaises((ValueError, subprocess.CalledProcessError)):
                self.policy.changed_paths(repo, 'missing', head)

    def test_non_pr_events_always_run_full_and_bad_diff_produces_no_outputs(self):
        for event in ['push', 'schedule', 'workflow_dispatch', 'workflow_call']:
            result = subprocess.run(['python3', str(SCRIPT), '--event', event], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(dict(line.split('=', 1) for line in result.stdout.splitlines()),
                             dict.fromkeys(['backend', 'oauth', 'schema', 'workflows'], 'true'))
        result = subprocess.run(['python3', str(SCRIPT), '--event', 'pull_request', '--base', 'bad', '--head', 'bad'], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0); self.assertEqual(result.stdout, '')


if __name__ == '__main__':
    unittest.main()
