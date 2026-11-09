#!/usr/bin/env python3
"""Verify a frozen minimal image without secrets; publish that exact CI artifact separately."""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

SOURCE = "662bd2c96b22aa5ef86e92c1c22d081d8ab5c0d9"
BASE = "vincentxxx/app@sha256:9f4e7c959e44be88340737494238e0cecab2b60fc56e2f646ee6e64d8b8647d8"
BASE_ID = "sha256:a2f913ba07668f19b1db7bc55457b1ef6b26951b88fd06598e539197db9f376f"
APP_REVISION = "4bd1ce56bad7eb25acc6da7b2e7d9a6949f48d22"
FILES = {
    "Dockerfile.production-hardening": "6ce91279e82fed4bd523e458e50ef3a69574d881d11efbf583214bbdf559ce0a",
    "scripts/__tests__/production-image-hardening.test.cjs": "0d1945222279be062ff519ac2ed4d9b9b1e96a7bc9575261c3230df3d159a8fc",
    "scripts/test-production-hardening-app.py": "adce9fc448fec243577e48e016dda01ca1801d1da039fe44c91a567419e22645",
    "scripts/prepare-log-directory.cjs": "826c7553033edd582544b0696eb88beeb9bd72a9cd4b746945bce7b3c92283d7",
    "scripts/log-directory-guard.cjs": "35d3a360fac4e111d319afc621e6266d399d47ca1b5bd6ca821172499dee4c0b",
    "scripts/preflight-container-logs.cjs": "6151afca08bbb2e18dc6db3b4c5627f04d4210136b2bbf0415c450083f562d11",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def verify_file(path, digest):
    require(
        re.fullmatch("[0-9a-f]{64}", digest) and sha(path) == digest,
        "Artifact checksum mismatch",
    )


def target(run_id, attempt):
    require(
        re.fullmatch("[1-9][0-9]{0,19}", run_id)
        and re.fullmatch("[1-9][0-9]{0,8}", attempt),
        "Invalid workflow run identity",
    )
    return (
        "vincentxxx/app:production-hardening-662bd2c96b22-ci-" + run_id + "-" + attempt
    )


def validate_app(a):
    require(
        "failure" not in a
        and a.get("health_status") == 200
        and a.get("negative_status") == 404
        and a.get("resources_cleaned") is True
        and a.get("cleanup_errors") == []
        and a.get("fixed_old_image_restored") is True,
        "Application/rollback/cleanup verification failed",
    )
    require(
        a.get("app_probe", {}).get("uid") == 1000
        and a.get("app_probe", {}).get("gid") == 1000,
        "Application is not UID/GID1000",
    )
    require(
        a.get("pm2")
        and all(
            p.get("status") == "online" and p.get("restarts") == 0 for p in a["pm2"]
        ),
        "Unstable PM2 fixture",
    )
    require(
        a.get("docs_status") == {"/api-docs/": 200, "/api/docs/": 200},
        "Documentation route regression",
    )


def validate_receipt(v, run_id, attempt, publisher_revision):
    require(
        re.fullmatch("[0-9a-f]{40}", publisher_revision), "Invalid publisher revision"
    )
    require(
        v.get("tag") == target(run_id, attempt)
        and v.get("run_id") == run_id
        and v.get("run_attempt") == attempt
        and v.get("publisher_revision") == publisher_revision,
        "Receipt belongs to a different workflow run",
    )
    require(
        v.get("source_revision") == SOURCE
        and v.get("base") == BASE
        and v.get("base_image_id") == BASE_ID,
        "Frozen source/base mismatch",
    )
    require(
        re.fullmatch("sha256:[0-9a-f]{64}", v.get("image_id", ""))
        and all(
            re.fullmatch("[0-9a-f]{64}", v.get(k, ""))
            for k in ["archive_sha256", "artifact_manifest_sha256"]
        ),
        "Invalid artifact identity",
    )
    require(
        v.get("verification") == "passed" and v.get("artifact_entries") == 27894,
        "Image verification incomplete",
    )
    validate_app(v.get("app_result", {}))


def validate_image(base, image, image_id):
    require(
        base["Id"] == BASE_ID
        and image["Id"] == image_id
        and image["Architecture"] == "amd64"
        and image["Os"] == "linux"
        and image["Config"]["User"] == "node",
        "Image identity/platform/user mismatch",
    )
    require(
        image["RootFS"]["Layers"][: len(base["RootFS"]["Layers"])]
        == base["RootFS"]["Layers"],
        "Base layers changed",
    )
    for key in ["Entrypoint", "Cmd", "WorkingDir", "Healthcheck", "ExposedPorts"]:
        require(
            image["Config"].get(key) == base["Config"].get(key),
            "Runtime metadata changed: " + key,
        )

    def env(values):
        result = dict(v.split("=", 1) for v in values)
        require(len(result) == len(values), "Duplicate image environment")
        return result

    old = env(base["Config"]["Env"])
    new = env(image["Config"]["Env"])
    require(new.pop("PM2_HOME", None) == "/home/node/.pm2", "PM2 home changed")
    old.pop("PM2_HOME", None)
    require(old == new, "Inherited environment changed")


def validate_archive(path, tag, image_id):
    with tarfile.open(path, "r:*") as archive:
        member = archive.getmember("manifest.json")
        require(
            member.isfile() and member.size < 1024 * 1024,
            "Invalid Docker archive manifest",
        )
        manifest = json.load(archive.extractfile(member))
        require(
            len(manifest) == 1 and manifest[0].get("RepoTags") == [tag],
            "Archive must contain only the candidate tag",
        )
        require(
            Path(manifest[0]["Config"]).name.removesuffix(".json")
            == image_id.removeprefix("sha256:"),
            "Archive image config mismatch",
        )


def runtime_digest(manifest):
    matches = [
        m["digest"]
        for m in manifest.get("manifests", [])
        if m.get("platform", {}).get("os") == "linux"
        and m.get("platform", {}).get("architecture") == "amd64"
    ]
    require(len(matches) == 1, "Expected exactly one amd64 runtime manifest")
    return matches[0]


class Docker:
    def __init__(self, log):
        self.log = Path(log)
        self.log.parent.mkdir(parents=True, exist_ok=True)

    def call(self, args, input=None, timeout=180):
        p = subprocess.run(
            ["docker", *args],
            input=input,
            text=True,
            capture_output=True,
            check=False,
            timeout=timeout,
        )
        with self.log.open("a") as f:
            f.write(
                json.dumps(
                    {
                        "command": ["docker", *args],
                        "exit": p.returncode,
                        "stdout": p.stdout if args[0] in ["push", "load"] else "",
                        "stderr": p.stderr[-2000:],
                    }
                )
                + "\n"
            )
        if p.returncode:
            raise RuntimeError("Docker command failed: " + args[0])
        return p.stdout + p.stderr if args[0] == "push" else p.stdout

    def image(self, ref):
        return json.loads(self.call(["image", "inspect", ref]))[0]


def verify(args):
    definition = Path(args.definition).resolve()
    bundle = Path(args.bundle).resolve()
    require(not bundle.exists(), "Bundle must be new")
    require(
        definition not in bundle.parents and bundle != definition,
        "Bundle must be outside definition",
    )
    bundle.mkdir(parents=True)
    for name, digest in FILES.items():
        verify_file(definition / name, digest)
    tag = target(args.run_id, args.run_attempt)
    require(
        re.fullmatch("[0-9a-f]{40}", args.publisher_revision),
        "Invalid publisher revision",
    )
    docker = Docker(bundle / "verify-commands.jsonl")
    work = Path(tempfile.mkdtemp(prefix="hardening-verify-"))
    image_created = False
    try:
        recipe = work / "Dockerfile"
        recipe.write_bytes(
            (definition / "Dockerfile.production-hardening").read_bytes()
        )
        docker.call(
            [
                "build",
                "--platform",
                "linux/amd64",
                "--network",
                "none",
                "--pull=false",
                "--label",
                "io.daodao.hardening.source-revision=" + SOURCE,
                "--label",
                "io.daodao.application.base-revision=" + APP_REVISION,
                "--label",
                "io.daodao.hardening.base-digest=" + BASE,
                "-t",
                tag,
                str(work),
            ]
        )
        image_created = True
        base = docker.image(BASE)
        image = docker.image(tag)
        validate_image(base, image, image["Id"])
        source = (
            definition / "scripts/__tests__/production-image-hardening.test.cjs"
        ).read_text()
        code = re.search(r"  const manifest = `(.*?)`;", source, re.DOTALL).group(1)
        manifests = [
            json.loads(
                docker.call(
                    [
                        "run",
                        "--rm",
                        "--pull",
                        "never",
                        "--platform",
                        "linux/amd64",
                        "--network",
                        "none",
                        "--entrypoint",
                        "node",
                        ref,
                        "-e",
                        code,
                    ]
                )
            )
            for ref in [BASE, tag]
        ]
        require(
            manifests[0] == manifests[1] and len(manifests[1]) == 27894,
            "Application artifact changed",
        )
        manifest_file = bundle / "artifact-manifest.json"
        manifest_file.write_text(json.dumps(manifests[1]))
        script = (
            (definition / "scripts/test-production-hardening-app.py")
            .read_text()
            .replace(
                "repo=Path(__file__).resolve().parents[1]",
                "repo=Path(" + repr(str(definition)) + ")",
            )
            .replace("candidate='daodao506-hardening:'+runid", "candidate=" + repr(tag))
        )
        lines = script.splitlines()
        changed = 0
        for i, line in enumerate(lines):
            if "docker(['build'" in line:
                lines[i] = (
                    " require_image=json.loads(docker(['image','inspect',candidate]).stdout)[0];assert require_image['Id']=="
                    + repr(image["Id"])
                    + ";image_created=False"
                )
                changed += 1
        require(changed == 1, "Frozen fixture build interception failed")
        runner = work / "app-audit.py"
        runner.write_text("\n".join(lines) + "\n")
        audit_dir = work / "app-audit"
        env = dict(
            os.environ,
            PRODUCTION_HARDENING_APP_TEST="1",
            PRODUCTION_HARDENING_EVIDENCE_DIR=str(audit_dir),
        )
        with (bundle / "app-audit.log").open("w") as log:
            p = subprocess.run(
                [sys.executable, str(runner)],
                cwd=definition,
                env=env,
                text=True,
                stdout=log,
                stderr=subprocess.STDOUT,
                check=False,
                timeout=600,
            )
        audit_result = audit_dir / "result.json"
        if audit_result.is_file():
            (bundle / "app-result.json").write_bytes(audit_result.read_bytes())
        require(p.returncode == 0, "Exact candidate application audit failed")
        app = json.loads(audit_result.read_text())
        validate_app(app)
        archive = bundle / "image.tar"
        docker.call(["save", "--output", str(archive), tag], timeout=300)
        validate_archive(archive, tag, image["Id"])
        receipt = {
            "source_revision": SOURCE,
            "base": BASE,
            "base_image_id": BASE_ID,
            "publisher_revision": args.publisher_revision,
            "run_id": args.run_id,
            "run_attempt": args.run_attempt,
            "tag": tag,
            "image_id": image["Id"],
            "archive_sha256": sha(archive),
            "artifact_manifest_sha256": sha(manifest_file),
            "artifact_entries": len(manifests[1]),
            "verification": "passed",
            "app_result": app,
        }
        validate_receipt(
            receipt, args.run_id, args.run_attempt, args.publisher_revision
        )
        (bundle / "receipt.json").write_text(json.dumps(receipt, indent=2))
        print(
            json.dumps({"tag": tag, "image_id": image["Id"], "verification": "passed"})
        )
    finally:
        if image_created:
            primary_error = sys.exc_info()[1]
            try:
                docker.call(["image", "rm", tag])
            except Exception as cleanup_error:
                if primary_error is None:
                    raise
                print(
                    "Candidate cleanup also failed: " + str(cleanup_error),
                    file=sys.stderr,
                )


def publish(args):
    bundle = Path(args.bundle).resolve()
    v = json.loads((bundle / "receipt.json").read_text())
    validate_receipt(v, args.run_id, args.run_attempt, args.publisher_revision)
    archive = bundle / "image.tar"
    verify_file(archive, v["archive_sha256"])
    verify_file(bundle / "artifact-manifest.json", v["artifact_manifest_sha256"])
    validate_archive(archive, v["tag"], v["image_id"])
    docker = Docker(bundle / "publish-commands.jsonl")
    docker.call(["load", "--input", str(archive)], timeout=300)
    image = docker.image(v["tag"])
    require(
        image["Id"] == v["image_id"]
        and image["Config"]["User"] == "node"
        and image["Architecture"] == "amd64",
        "Loaded artifact differs from verified image",
    )
    output = docker.call(["push", v["tag"]], timeout=600)
    found = re.findall(r"digest:\s*(sha256:[0-9a-f]{64})", output)
    require(found, "Registry returned no digest")
    digest = found[-1]
    ref = "vincentxxx/app@" + digest
    manifest = json.loads(docker.call(["manifest", "inspect", ref]))
    runtime = ref
    if "manifests" in manifest:
        runtime = "vincentxxx/app@" + runtime_digest(manifest)
        manifest = json.loads(docker.call(["manifest", "inspect", runtime]))
    require(
        manifest["config"]["digest"] == v["image_id"],
        "Remote image config differs from tested artifact",
    )
    docker.call(["pull", "--platform", "linux/amd64", ref])
    require(
        docker.image(ref)["Id"] == v["image_id"], "Pulled registry artifact mismatch"
    )
    result = {
        "tag": v["tag"],
        "immutable_reference": ref,
        "registry_digest": digest,
        "image_id": v["image_id"],
        "source_revision": SOURCE,
        "application_base_revision": APP_REVISION,
        "publisher_revision": args.publisher_revision,
        "archive_sha256": v["archive_sha256"],
        "remote_config_matches_tested": True,
        "pull_by_digest_verified": True,
        "production_cutover_performed": False,
    }
    (bundle / "publication-receipt.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["verify", "publish"])
    parser.add_argument("--definition")
    parser.add_argument("--bundle", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--run-attempt", required=True)
    parser.add_argument("--publisher-revision", required=True)
    args = parser.parse_args()
    if args.mode == "verify":
        require(args.definition, "Frozen definition is required")
        verify(args)
    else:
        publish(args)


if __name__ == "__main__":
    main()
