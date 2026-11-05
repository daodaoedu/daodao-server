"""Keep the local runner and CI on the same canonical database input."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / ".github/scripts/test-database-config.py"
CONFIG = ROOT / ".github/test-database.json"
WORKFLOW = ROOT / ".github/workflows/continuous-integration.yml"


class SharedTestDatabaseTests(unittest.TestCase):
    def run_config(self, config):
        with tempfile.TemporaryDirectory(prefix="test-db-config-") as directory:
            github = Path(directory) / ".github"
            (github / "scripts").mkdir(parents=True)
            script = github / "scripts" / SCRIPT.name
            shutil.copyfile(SCRIPT, script)
            (github / CONFIG.name).write_text(json.dumps(config))
            return subprocess.run(["python3", str(script)], capture_output=True,
                                  text=True, timeout=5)

    def test_schema_pin_is_read_from_manifest_instead_of_embedded_in_reader(self):
        config = json.loads(CONFIG.read_text())
        for pin in (config["storageRef"], "a" * 40):
            with self.subTest(pin=pin):
                result = self.run_config({**config, "storageRef": pin})
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(dict(line.split("=", 1) for line in result.stdout.splitlines()), {
                    "storage_repository": "daodaoedu/daodao-storage",
                    "storage_ref": pin,
                    "schema_directory": "schema",
                })

    def test_invalid_or_noncanonical_configuration_fails_without_partial_outputs(self):
        config = json.loads(CONFIG.read_text())
        for patch in ({"storageRef": "dev"}, {"storageRef": "bad\nvalue"},
                      {"storageRepository": "outsider/other"},
                      {"schemaDirectory": "schema; touch /tmp/not-a-command"},
                      {"postgresImage": "postgres:latest"}):
            with self.subTest(patch=patch):
                result = self.run_config({**config, **patch})
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, "")
                self.assertIn("Invalid test database configuration", result.stderr)

    def test_nonobject_configuration_is_rejected(self):
        for value in (None, [], "not an object"):
            with self.subTest(value=value):
                result = self.run_config(value)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, "")
                self.assertIn("Invalid test database configuration", result.stderr)

    def test_ci_uses_shared_manifest_and_keeps_runner_tests_blocking(self):
        workflow = yaml.safe_load(WORKFLOW.read_text())
        config = json.loads(CONFIG.read_text())
        job = workflow["jobs"]["test"]
        self.assertEqual(job["services"]["postgres"]["image"], config["postgresImage"])
        steps = job["steps"]
        reader = next(step for step in steps if step.get("id") == "test-db")
        checkout = next(step for step in steps if step.get("name") == "Checkout database schema for integration tests")
        self.assertLess(steps.index(reader), steps.index(checkout))
        self.assertEqual(checkout["with"]["repository"], "${{ steps.test-db.outputs.storage_repository }}")
        self.assertEqual(checkout["with"]["ref"], "${{ steps.test-db.outputs.storage_ref }}")
        self.assertFalse(checkout["with"]["persist-credentials"])
        bootstrap = next(step for step in steps if step.get("name") == "Initialize disposable integration database")
        self.assertIn("init-test-database.sh", bootstrap["run"])
        self.assertIn("steps.test-db.outputs.schema_directory", bootstrap["run"])
        tests = next(step for step in steps if step.get("name") == "Test local integration runner")
        self.assertEqual(tests["run"], "pnpm run test:runner")
        self.assertNotIn("if", tests)
        self.assertFalse(tests.get("continue-on-error", False))
        with tempfile.TemporaryDirectory(prefix="ci-db-output-") as directory:
            output = Path(directory) / "output"
            result = subprocess.run(["bash", "-eo", "pipefail", "-c", reader["run"]],
                                    cwd=ROOT, env={**os.environ, "GITHUB_OUTPUT": str(output)},
                                    capture_output=True, text=True, timeout=5)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn(f"storage_ref={config['storageRef']}\n", output.read_text())


if __name__ == "__main__":
    unittest.main()
