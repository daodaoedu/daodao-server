#!/usr/bin/env python3
"""Expose the repository-owned test database configuration to CI."""
import json
from pathlib import Path
import re
import sys


def main() -> int:
    try:
        config = json.loads((Path(__file__).resolve().parents[1] / "test-database.json").read_text())
        if not isinstance(config, dict):
            raise ValueError("Expected a test database configuration object")
        if config.get("storageRepository") != "daodaoedu/daodao-storage":
            raise ValueError("Unexpected canonical schema repository")
        if not re.fullmatch(r"[0-9a-f]{40}", config.get("storageRef", "")):
            raise ValueError("Test schema ref must be a full commit SHA")
        if config.get("schemaDirectory") != "schema":
            raise ValueError("Unexpected canonical schema directory")
        if not re.fullmatch(r"postgres:[0-9]+(?:\.[0-9]+)*-alpine", config.get("postgresImage", "")):
            raise ValueError("Test database image must pin a PostgreSQL version")
        for key, name in (("storageRepository", "storage_repository"),
                          ("storageRef", "storage_ref"),
                          ("schemaDirectory", "schema_directory")):
            print(f"{name}={config[key]}")
        return 0
    except (OSError, ValueError, TypeError):
        print("Invalid test database configuration; check .github/test-database.json", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
