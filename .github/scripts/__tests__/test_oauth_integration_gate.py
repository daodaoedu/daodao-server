"""Exercise the OAuth CI step's failure propagation, not the provider's UI."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[3]


class OAuthIntegrationGateTests(unittest.TestCase):
    def test_oauth_failure_blocks_the_existing_required_test_job(self):
        workflow = yaml.safe_load(
            (ROOT / ".github/workflows/continuous-integration.yml").read_text()
        )
        job = workflow["jobs"]["backend"]
        step = next(
            entry for entry in job["steps"]
            if entry.get("name") == "Run OAuth integration tests"
        )
        self.assertEqual(step["if"], "needs.workflow-tests.outputs.oauth == 'true'")
        self.assertFalse(step.get("continue-on-error", False))
        self.assertFalse(job.get("continue-on-error", False))
        for exit_code in (0, 37):
            with self.subTest(exit_code=exit_code), tempfile.TemporaryDirectory() as directory:
                directory = Path(directory)
                executable = directory / "pnpm"
                executable.write_text(
                    '#!/bin/sh\n'
                    '[ "$1" = run ] && [ "$2" = test:oauth:integration ] || exit 99\n'
                    'printf called > "$CALLED"\n'
                    'exit "$OAUTH_EXIT"\n'
                )
                executable.chmod(0o755)
                result = subprocess.run(
                    ["bash", "--noprofile", "--norc", "-eo", "pipefail", "-c", step["run"]],
                    env={**os.environ, "PATH": f"{directory}:{os.environ['PATH']}",
                         "CALLED": str(directory / "called"), "OAUTH_EXIT": str(exit_code)},
                    capture_output=True, text=True, timeout=5,
                )
                self.assertTrue((directory / "called").exists())
                self.assertEqual(result.returncode, exit_code, result.stderr)

    def test_oauth_uses_explicit_disposable_services(self):
        workflow = yaml.safe_load(
            (ROOT / ".github/workflows/continuous-integration.yml").read_text()
        )
        job = workflow["jobs"]["backend"]
        step = next(
            entry for entry in job["steps"]
            if entry.get("name") == "Run OAuth integration tests"
        )
        environment = step["env"]
        self.assertEqual(str(environment["OAUTH_INTEGRATION_TEST"]), "1")
        self.assertEqual(environment["OAUTH_TEST_DATABASE_URL"], "${{ env.DATABASE_URL }}")
        self.assertEqual(environment["OAUTH_TEST_REDIS_URL"], "redis://127.0.0.1:6379/0")
        self.assertEqual(str(environment["OAUTH_TEST_SMTP_PORT"]), "1025")
        self.assertEqual(environment["OAUTH_TEST_MAILPIT_URL"], "http://127.0.0.1:8025")
        self.assertIn("127.0.0.1:5432:5432", job["services"]["postgres"]["ports"])
        self.assertIn("127.0.0.1:6379:6379", job["services"]["redis"]["ports"])
        self.assertIn("127.0.0.1:1025:1025", job["services"]["mailpit"]["ports"])
        self.assertIn("127.0.0.1:8025:8025", job["services"]["mailpit"]["ports"])
        owner = "${{ github.run_id }}-${{ github.run_attempt }}-oauth"
        self.assertEqual(environment["OAUTH_TEST_RUN_ID"], owner)
        for name in ("postgres", "redis", "mailpit"):
            self.assertIn(f"--label io.daodao.local-tests={owner}", job["services"][name]["options"])
            self.assertEqual(
                environment[f"OAUTH_TEST_{name.upper()}_CONTAINER_ID"],
                "${{ job.services." + name + ".id }}",
            )


if __name__ == "__main__":
    unittest.main()
