import unittest


class BenchmarkEnforcementFixture(unittest.TestCase):
    def test_required_check_blocks_merge(self):
        self.fail('intentional required-check enforcement fixture')
