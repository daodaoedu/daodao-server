import contextlib
import importlib.util
import io
import json
import subprocess
import tarfile
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

MODULE = Path(__file__).resolve().parents[1] / "production-hardening-release.py"
spec = importlib.util.spec_from_file_location("hardening_release", MODULE)
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseTests(unittest.TestCase):
    def receipt(self):
        return {
            "source_revision": release.SOURCE,
            "base": release.BASE,
            "base_image_id": release.BASE_ID,
            "publisher_revision": "a" * 40,
            "run_id": "123",
            "run_attempt": "1",
            "tag": release.target("123", "1"),
            "image_id": "sha256:" + "b" * 64,
            "archive_sha256": "c" * 64,
            "artifact_manifest_sha256": "d" * 64,
            "artifact_entries": 27894,
            "verification": "passed",
            "app_result": {
                "health_status": 200,
                "negative_status": 404,
                "resources_cleaned": True,
                "cleanup_errors": [],
                "fixed_old_image_restored": True,
                "app_probe": {"uid": 1000, "gid": 1000},
                "pm2": [{"status": "online", "restarts": 0}],
                "docs_status": {"/api-docs/": 200, "/api/docs/": 200},
            },
        }

    def test_target_is_unique_candidate_not_mutable_production(self):
        self.assertEqual(
            release.target("123", "2"),
            "vincentxxx/app:production-hardening-662bd2c96b22-ci-123-2",
        )
        for value in ["0", "../x", "1;pwd", "", "1 2"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                release.target(value, "1")

    def test_receipt_binds_workflow_run_and_exact_verified_image(self):
        value = self.receipt()
        release.validate_receipt(value, "123", "1", "a" * 40)
        for field, bad in [
            ("tag", "vincentxxx/app:production"),
            ("source_revision", "f" * 40),
            ("base", "vincentxxx/app:latest"),
            ("publisher_revision", "b" * 40),
            ("run_id", "124"),
            ("verification", "failed"),
            ("artifact_entries", 0),
        ]:
            changed = {**value, field: bad}
            with self.subTest(field=field), self.assertRaises(ValueError):
                release.validate_receipt(changed, "123", "1", "a" * 40)

    def test_failed_or_dirty_fixture_cannot_publish(self):
        for field, bad in [
            ("health_status", 503),
            ("resources_cleaned", False),
            ("cleanup_errors", ["remaining"]),
            ("fixed_old_image_restored", False),
            ("failure", "some failure"),
        ]:
            value = self.receipt()
            value["app_result"] = {**value["app_result"], field: bad}
            with self.subTest(field=field), self.assertRaises(ValueError):
                release.validate_receipt(value, "123", "1", "a" * 40)

    def test_image_config_binds_base_runtime_and_candidate_identity(self):
        base = {
            "Id": release.BASE_ID,
            "Architecture": "amd64",
            "Os": "linux",
            "RootFS": {"Layers": ["a"]},
            "Config": {
                "Env": ["NODE_ENV=prod"],
                "User": "",
                "Cmd": ["pm2"],
                "Entrypoint": ["entry"],
                "WorkingDir": "/app",
                "Healthcheck": {},
                "ExposedPorts": {"3000/tcp": {}},
            },
        }
        image = {
            **base,
            "Id": "sha256:" + "b" * 64,
            "RootFS": {"Layers": ["a", "b"]},
            "Config": {
                **base["Config"],
                "Env": ["NODE_ENV=prod", "PM2_HOME=/home/node/.pm2"],
                "User": "node",
            },
        }
        release.validate_image(base, image, image["Id"])
        for changed in [
            {**image, "Architecture": "arm64"},
            {**image, "Config": {**image["Config"], "Cmd": ["different"]}},
            {
                **image,
                "Config": {
                    **image["Config"],
                    "Env": ["NODE_ENV=dev", "PM2_HOME=/home/node/.pm2"],
                },
            },
        ]:
            with self.assertRaises(ValueError):
                release.validate_image(base, changed, image["Id"])

    def test_archive_cannot_load_extra_or_mutable_tags(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "image.tar"
            tag = release.target("123", "1")
            image = "sha256:" + "b" * 64

            def write(tags):
                data = json.dumps(
                    [{"Config": "b" * 64 + ".json", "RepoTags": tags, "Layers": []}]
                ).encode()
                with tarfile.open(p, "w") as t:
                    info = tarfile.TarInfo("manifest.json")
                    info.size = len(data)
                    t.addfile(info, io.BytesIO(data))

            write([tag])
            release.validate_archive(p, tag, image)
            write([tag, "vincentxxx/app:production"])
            with self.assertRaises(ValueError):
                release.validate_archive(p, tag, image)

    def test_changed_archive_is_rejected_before_docker(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "image.tar"
            p.write_bytes(b"changed")
            with self.assertRaises(ValueError):
                release.verify_file(p, "0" * 64)

    def test_remote_manifest_selects_only_amd64(self):
        index = {
            "manifests": [
                {
                    "digest": "sha256:" + "1" * 64,
                    "platform": {"os": "linux", "architecture": "amd64"},
                },
                {
                    "digest": "sha256:" + "2" * 64,
                    "platform": {"os": "unknown", "architecture": "unknown"},
                },
            ]
        }
        self.assertEqual(release.runtime_digest(index), "sha256:" + "1" * 64)
        with self.assertRaises(ValueError):
            release.runtime_digest({"manifests": []})

    def bundle(self, directory):
        bundle = Path(directory)
        value = self.receipt()
        manifest = bundle / "artifact-manifest.json"
        manifest.write_text("[]")
        archive = bundle / "image.tar"
        data = json.dumps(
            [
                {
                    "Config": "blobs/sha256/" + "b" * 64,
                    "RepoTags": [value["tag"]],
                    "Layers": [],
                }
            ]
        ).encode()
        with tarfile.open(archive, "w") as tar:
            member = tarfile.TarInfo("manifest.json")
            member.size = len(data)
            tar.addfile(member, io.BytesIO(data))
        value.update(
            archive_sha256=release.sha(archive),
            artifact_manifest_sha256=release.sha(manifest),
        )
        (bundle / "receipt.json").write_text(json.dumps(value))
        return SimpleNamespace(
            bundle=str(bundle),
            run_id="123",
            run_attempt="1",
            publisher_revision="a" * 40,
        ), value

    def test_publish_loads_verified_archive_and_checks_registry_and_pull(self):
        with tempfile.TemporaryDirectory() as directory:
            args, value = self.bundle(directory)
            docker = Mock()
            digest = "sha256:" + "e" * 64
            docker.image.return_value = {
                "Id": value["image_id"],
                "Config": {"User": "node"},
                "Architecture": "amd64",
            }
            docker.call.side_effect = lambda command, **kwargs: (
                "digest: " + digest
                if command[0] == "push"
                else json.dumps({"config": {"digest": value["image_id"]}})
                if command[0] == "manifest"
                else ""
            )
            with (
                patch.object(release, "Docker", return_value=docker),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                release.publish(args)
            commands = [call.args[0] for call in docker.call.call_args_list]
            self.assertEqual(
                commands,
                [
                    ["load", "--input", str(Path(directory).resolve() / "image.tar")],
                    ["push", value["tag"]],
                    ["manifest", "inspect", "vincentxxx/app@" + digest],
                    ["pull", "--platform", "linux/amd64", "vincentxxx/app@" + digest],
                ],
            )
            result = json.loads(
                (Path(directory) / "publication-receipt.json").read_text()
            )
            self.assertTrue(result["pull_by_digest_verified"])
            self.assertFalse(result["production_cutover_performed"])

    def test_publish_rejects_bad_handoff_before_docker(self):
        for damage in ["checksum", "run", "mutable"]:
            with (
                self.subTest(damage=damage),
                tempfile.TemporaryDirectory() as directory,
            ):
                args, value = self.bundle(directory)
                if damage == "checksum":
                    (Path(directory) / "image.tar").write_bytes(b"corrupt")
                elif damage == "run":
                    args.run_id = "124"
                else:
                    value["tag"] = "vincentxxx/app:production"
                    (Path(directory) / "receipt.json").write_text(json.dumps(value))
                with (
                    patch.object(release, "Docker") as docker,
                    self.assertRaises(ValueError),
                ):
                    release.publish(args)
                docker.assert_not_called()

    def test_publish_remote_mismatch_never_emits_success_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            args, value = self.bundle(directory)
            docker = Mock()
            docker.image.return_value = {
                "Id": value["image_id"],
                "Config": {"User": "node"},
                "Architecture": "amd64",
            }
            docker.call.side_effect = lambda command, **kwargs: (
                "digest: sha256:" + "e" * 64
                if command[0] == "push"
                else json.dumps({"config": {"digest": "sha256:" + "f" * 64}})
                if command[0] == "manifest"
                else ""
            )
            with (
                patch.object(release, "Docker", return_value=docker),
                self.assertRaisesRegex(ValueError, "Remote image config"),
            ):
                release.publish(args)
            self.assertFalse((Path(directory) / "publication-receipt.json").exists())
            self.assertFalse(
                any(call.args[0][0] == "pull" for call in docker.call.call_args_list)
            )

    def test_push_denial_never_emits_success_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            args, value = self.bundle(directory)
            docker = Mock()
            docker.image.return_value = {
                "Id": value["image_id"],
                "Config": {"User": "node"},
                "Architecture": "amd64",
            }

            def command_result(command, **kwargs):
                if command[0] == "push":
                    raise RuntimeError("registry denied")
                return ""

            docker.call.side_effect = command_result
            with (
                patch.object(release, "Docker", return_value=docker),
                self.assertRaisesRegex(RuntimeError, "registry denied"),
            ):
                release.publish(args)
            self.assertFalse((Path(directory) / "publication-receipt.json").exists())
            self.assertEqual(
                [call.args[0][0] for call in docker.call.call_args_list],
                ["load", "push"],
            )

    def test_push_digest_accepts_stderr_without_polluting_inspect_json(self):
        with tempfile.TemporaryDirectory() as directory:
            docker = release.Docker(Path(directory) / "commands.jsonl")
            process = subprocess.CompletedProcess(
                [], 0, stdout="", stderr="digest: sha256:" + "e" * 64
            )
            with patch.object(release.subprocess, "run", return_value=process):
                self.assertIn("digest:", docker.call(["push", "candidate"]))
            process.stdout = '[{"Id":"image"}]'
            process.stderr = "warning"
            with patch.object(release.subprocess, "run", return_value=process):
                self.assertEqual(docker.image("candidate"), {"Id": "image"})

    def test_failed_app_audit_preserves_detailed_result_without_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            definition = Path(directory) / "definition"
            (definition / "scripts/__tests__").mkdir(parents=True)
            (definition / "Dockerfile.production-hardening").write_text("FROM image")
            (
                definition / "scripts/__tests__/production-image-hardening.test.cjs"
            ).write_text("  const manifest = `fixture`;")
            (definition / "scripts/test-production-hardening-app.py").write_text(
                " docker(['build'])\n"
            )
            bundle = Path(directory) / "bundle"
            args = SimpleNamespace(
                definition=str(definition),
                bundle=str(bundle),
                run_id="123",
                run_attempt="1",
                publisher_revision="a" * 40,
            )
            docker = Mock()
            docker.image.return_value = {"Id": "sha256:" + "b" * 64}
            docker.call.side_effect = lambda command, **kwargs: (
                json.dumps([{}] * 27894) if command[0] == "run" else ""
            )
            details = {
                "failure": "API startup failed",
                "cleanup_errors": ["container cleanup failed"],
            }

            def audit(*args, **kwargs):
                result_dir = Path(kwargs["env"]["PRODUCTION_HARDENING_EVIDENCE_DIR"])
                result_dir.mkdir(parents=True)
                (result_dir / "result.json").write_text(json.dumps(details))
                return subprocess.CompletedProcess([], 1)

            with (
                patch.object(release, "Docker", return_value=docker),
                patch.object(release, "verify_file"),
                patch.object(release, "validate_image"),
                patch.object(release.subprocess, "run", side_effect=audit),
                self.assertRaisesRegex(ValueError, "application audit failed"),
            ):
                release.verify(args)
            self.assertEqual(
                json.loads((bundle / "app-result.json").read_text()), details
            )
            self.assertFalse((bundle / "receipt.json").exists())

    def test_cleanup_failure_preserves_primary_verification_error(self):
        with tempfile.TemporaryDirectory() as directory:
            definition = Path(directory) / "definition"
            definition.mkdir()
            (definition / "Dockerfile.production-hardening").write_text("FROM image")
            args = SimpleNamespace(
                definition=str(definition),
                bundle=str(Path(directory) / "bundle"),
                run_id="123",
                run_attempt="1",
                publisher_revision="a" * 40,
            )
            docker = Mock()
            docker.image.side_effect = RuntimeError("primary inspect failure")
            docker.call.side_effect = lambda command, **kwargs: (
                (_ for _ in ()).throw(RuntimeError("cleanup daemon missing"))
                if command[:2] == ["image", "rm"]
                else ""
            )
            with (
                patch.object(release, "Docker", return_value=docker),
                patch.object(release, "verify_file"),
                contextlib.redirect_stderr(io.StringIO()) as errors,
                self.assertRaisesRegex(RuntimeError, "primary inspect failure"),
            ):
                release.verify(args)
            self.assertIn("cleanup daemon missing", errors.getvalue())


if __name__ == "__main__":
    unittest.main()
