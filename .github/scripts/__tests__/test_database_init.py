"""Guard the disposable database initializer without requiring Docker."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "init-test-database.sh"


class DatabaseInitTests(unittest.TestCase):
    def test_init_requires_empty_database_and_propagates_sql_failure(self):
        for count, sql_exit in (("0", 0), ("1", 0), ("0", 42)):
            with self.subTest(count=count, sql_exit=sql_exit):
                with tempfile.TemporaryDirectory(prefix="ci-db-init-") as directory:
                    directory = Path(directory)
                    schema = directory / "schema"
                    schema.mkdir()
                    (schema / "001.sql").write_text("CREATE TABLE first_table (id INT);\n")
                    (schema / "002.sql").write_text("CREATE TABLE second_table (id INT);\n")
                    docker = directory / "docker"
                    docker.write_text(
                        '#!/bin/bash\n'
                        'if [ "$2" != "-i" ]; then echo "$TABLE_COUNT"; exit 0; fi\n'
                        'cat >> "$SQL_LOG"\n'
                        'exit "$SQL_EXIT"\n'
                    )
                    docker.chmod(0o755)
                    log = directory / "sql.log"
                    result = subprocess.run(
                        ["bash", str(SCRIPT), "test-postgres", str(schema)],
                        env={**os.environ, "PATH": f"{directory}:{os.environ['PATH']}",
                             "TABLE_COUNT": count, "SQL_EXIT": str(sql_exit), "SQL_LOG": str(log)},
                        capture_output=True, text=True, timeout=5,
                    )
                    self.assertEqual(result.returncode == 0, count == "0" and sql_exit == 0)
                    if count != "0":
                        self.assertFalse(log.exists())
                    else:
                        sql = log.read_text()
                        self.assertIn("first_table", sql)
                        self.assertEqual("second_table" in sql, sql_exit == 0)

    def test_missing_schema_and_invalid_container_are_rejected(self):
        with tempfile.TemporaryDirectory(prefix="ci-db-init-empty-") as directory:
            for container in ("test-postgres", "--privileged"):
                result = subprocess.run(["bash", str(SCRIPT), container, directory],
                                        capture_output=True, text=True, timeout=5)
                self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
