import os
from pathlib import Path
import subprocess
import unittest

WORKFLOW = Path(__file__).resolve().parents[2] / "workflows" / "schema-drift.yml"

def validation_blocks():
    text = WORKFLOW.read_text()
    blocks = []
    for step in text.split("- name: Validate immutable paired")[1:]:
        step = step.split("      - name:", 1)[0]
        block = step.split("        run: |\n", 1)[1]
        blocks.append("\n".join(line[10:] for line in block.splitlines() if line.startswith("          ")))
    if not blocks:
        raise AssertionError("Missing paired revision validation")
    return blocks

class PairedRevisionValidation(unittest.TestCase):
    def check_refs(self, expected, **refs):
        for block in validation_blocks():
            result = subprocess.run(["bash", "-e", "-c", block],
                env={**os.environ, **refs}, capture_output=True, text=True)
            self.assertEqual(result.returncode == 0, expected, result.stderr)

    def test_empty_and_immutable_pairs(self):
        self.check_refs(True, STORAGE_REF="", FRONTEND_REF="")
        self.check_refs(True, STORAGE_REF="a" * 40, FRONTEND_REF="")
        self.check_refs(True, STORAGE_REF="a" * 40, FRONTEND_REF="b" * 40)

    def test_rejects_mutable_malformed_and_incomplete_pairs(self):
        for value in ["dev", "a" * 39, "A" * 40, "a" * 40 + "\n", "$(exit 0)"]:
            self.check_refs(False, STORAGE_REF=value, FRONTEND_REF="")
            self.check_refs(False, STORAGE_REF="a" * 40, FRONTEND_REF=value)
        self.check_refs(False, STORAGE_REF="", FRONTEND_REF="b" * 40)

if __name__ == "__main__":
    unittest.main()
