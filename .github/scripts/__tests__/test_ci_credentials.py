"""Credential-lifetime invariants for repository-controlled quality-check jobs."""
import unittest
from pathlib import Path

import yaml

WORKFLOWS = Path(__file__).resolve().parents[2] / "workflows"


class QualityWorkflowCredentialsTest(unittest.TestCase):
    def test_quality_jobs_have_explicit_readonly_token(self):
        for name in ("continuous-integration.yml", "schema-drift.yml"):
            with self.subTest(workflow=name):
                workflow = yaml.safe_load((WORKFLOWS / name).read_text())
                self.assertEqual(workflow.get("permissions"), {"contents": "read"})
                for job in workflow["jobs"].values():
                    self.assertTrue(
                        all(value in ("read", "none") for value in job.get("permissions", {}).values()),
                        "Quality checks must not acquire write permissions",
                    )

    def test_checkout_credentials_do_not_survive_into_repository_code(self):
        for name in ("continuous-integration.yml", "schema-drift.yml"):
            workflow = yaml.safe_load((WORKFLOWS / name).read_text())
            checkouts = [
                step
                for job in workflow["jobs"].values()
                for step in job.get("steps", [])
                if step.get("uses", "").startswith("actions/checkout@")
            ]
            self.assertTrue(checkouts)
            for step in checkouts:
                with self.subTest(workflow=name, step=step.get("name", "checkout")):
                    self.assertIs(
                        step.get("with", {}).get("persist-credentials"), False,
                        "Later install, test and schema commands must not inherit checkout credentials",
                    )


if __name__ == "__main__":
    unittest.main()
