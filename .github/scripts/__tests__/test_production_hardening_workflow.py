"""Boundary contracts for the manually invoked, image-only publisher."""

import json
import os
import subprocess
import unittest
from pathlib import Path

import yaml

WORKFLOW = (
    Path(__file__).resolve().parents[2] / "workflows/publish-production-hardening.yml"
)
DEFINITION = "662bd2c96b22aa5ef86e92c1c22d081d8ab5c0d9"
BASE = "vincentxxx/app@sha256:9f4e7c959e44be88340737494238e0cecab2b60fc56e2f646ee6e64d8b8647d8"


class ProductionHardeningWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.raw = WORKFLOW.read_text()
        self.workflow = yaml.safe_load(self.raw)

    def test_only_inputless_manual_dispatch_and_serial_readonly_jobs(self):
        # PyYAML's YAML 1.1 reader treats the unquoted key 'on' as True.
        self.assertEqual(
            self.workflow.get("on", self.workflow.get(True)),
            {"workflow_dispatch": None},
        )
        self.assertEqual(self.workflow["permissions"], {"contents": "read"})
        self.assertIs(self.workflow["concurrency"]["cancel-in-progress"], False)
        self.assertEqual(set(self.workflow["jobs"]), {"verify", "publish"})
        self.assertEqual(self.workflow["jobs"]["publish"]["needs"], "verify")
        for job in self.workflow["jobs"].values():
            self.assertEqual(job["if"], "github.ref == 'refs/heads/dev'")
            self.assertNotIn("environment", job)
            self.assertNotIn("permissions", job)

    def test_checkout_trust_and_frozen_definition(self):
        for name, job in self.workflow["jobs"].items():
            checkouts = [
                s
                for s in job["steps"]
                if s.get("uses", "").startswith("actions/checkout@")
            ]
            self.assertEqual(len(checkouts), 2 if name == "verify" else 1)
            self.assertEqual(checkouts[0]["with"]["ref"], "${{ github.sha }}")
            for checkout in checkouts:
                self.assertIs(checkout["with"]["persist-credentials"], False)
            if name == "verify":
                self.assertEqual(checkouts[1]["with"]["ref"], DEFINITION)
                self.assertEqual(checkouts[1]["with"]["path"], "release-definition")

    def test_verification_before_credentials_and_exact_bundle_transfer(self):
        verify = self.workflow["jobs"]["verify"]["steps"]
        publish = self.workflow["jobs"]["publish"]["steps"]
        self.assertNotIn("secrets.", str(verify))
        pnpm = next(
            i
            for i, s in enumerate(verify)
            if s.get("uses", "").startswith("pnpm/action-setup@")
        )
        node = next(
            i
            for i, s in enumerate(verify)
            if s.get("uses", "").startswith("actions/setup-node@")
        )
        self.assertLess(pnpm, node)
        self.assertEqual(verify[pnpm]["with"]["version"], 9)
        self.assertEqual(verify[node]["with"]["node-version"], 20)
        install = next(s for s in verify if "pnpm install" in s.get("run", ""))
        self.assertEqual(install["working-directory"], "release-definition")
        self.assertIn("pnpm install --frozen-lockfile --ignore-scripts", install["run"])
        commands = "\n".join(s.get("run", "") for s in verify)
        for image in (BASE, "postgres:14", "redis:6.0-alpine"):
            self.assertIn("docker pull --platform linux/amd64 " + image, commands)
        for mode, steps in (("verify", verify), ("publish", publish)):
            command = next(
                s["run"]
                for s in steps
                if f"production-hardening-release.py {mode} " in s.get("run", "")
            )
            for flag in (
                '--bundle "$RUNNER_TEMP/hardening-bundle"',
                '--run-id "$GITHUB_RUN_ID"',
                '--run-attempt "$GITHUB_RUN_ATTEMPT"',
                '--publisher-revision "$GITHUB_SHA"',
            ):
                self.assertIn(flag, command)
        upload = next(
            s for s in verify if s.get("uses") == "actions/upload-artifact@v4"
        )
        download = next(
            s for s in publish if s.get("uses") == "actions/download-artifact@v4"
        )
        self.assertEqual(upload["with"]["name"], download["with"]["name"])
        self.assertEqual(upload["if"], "always()")
        self.assertEqual(upload["with"]["retention-days"], 7)
        self.assertEqual(upload["with"]["path"], download["with"]["path"])
        login = next(s for s in publish if s.get("uses") == "docker/login-action@v3")
        self.assertEqual(
            login["with"],
            {
                "username": "${{ secrets.DOCKER_HUB_USERNAME }}",
                "password": "${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}",
            },
        )
        runs = "\n".join(s.get("run", "") for s in publish)
        for forbidden in (
            "docker build",
            "docker run",
            "pnpm",
            "npm install",
            "apt-get",
            "ssh",
            "scp",
        ):
            self.assertNotIn(forbidden, runs)
        self.assertTrue(
            any(s.get("uses") == "actions/upload-artifact@v4" for s in publish)
        )

    def test_shell_preserves_bundle_path_spaces_without_literal_quotes(self):
        # Replace the executable with an argv recorder; never execute the publisher.
        for mode in ("verify", "publish"):
            steps = self.workflow["jobs"][mode]["steps"]
            command = next(
                s["run"]
                for s in steps
                if f"production-hardening-release.py {mode} " in s.get("run", "")
            )
            arguments = command.split(f"production-hardening-release.py {mode}", 1)[1]
            recorder = "python3 -c 'import json,sys; print(json.dumps(sys.argv[1:]))' "
            result = subprocess.run(
                ["/bin/sh", "-c", recorder + arguments],
                env={
                    **os.environ,
                    "RUNNER_TEMP": "/tmp/runner with spaces",
                    "GITHUB_RUN_ID": "123",
                    "GITHUB_RUN_ATTEMPT": "2",
                    "GITHUB_SHA": "a" * 40,
                },
                check=True,
                capture_output=True,
                text=True,
            )
            argv = json.loads(result.stdout)
            self.assertEqual(
                argv[argv.index("--bundle") + 1],
                "/tmp/runner with spaces/hardening-bundle",
            )
            self.assertEqual(argv[argv.index("--run-id") + 1], "123")
            self.assertEqual(argv[argv.index("--run-attempt") + 1], "2")
            self.assertEqual(argv[argv.index("--publisher-revision") + 1], "a" * 40)

    def test_no_deployment_or_other_release_workflow(self):
        for forbidden in (
            "appleboy",
            "SSH_",
            "PRODUCTION_HOST",
            "continuous-delivery",
            "emergency-rebuild",
            "workflow_call",
            "workflow_run",
        ):
            self.assertNotIn(forbidden, self.raw)


if __name__ == "__main__":
    unittest.main()
