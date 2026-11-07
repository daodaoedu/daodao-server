"""Exercise the required gate's real CLI and workflow execution contracts."""
import json
import os
import re
from pathlib import Path
import subprocess
import tempfile
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / '.github/scripts/check-ci-result.py'


class ResultTests(unittest.TestCase):
    def plan(self, backend='true'):
        return {'backend': backend, 'oauth': backend, 'schema': 'false', 'workflows': 'false'}

    def run_gate(self, scope, payload, expected):
        result = subprocess.run(['python3', str(SCRIPT), scope], env={**os.environ,
            'NEEDS_JSON' if scope == 'test' else 'PLAN_JSON': json.dumps(payload)},
            capture_output=True, text=True, timeout=5)
        self.assertEqual(result.returncode == 0, expected, result.stdout + result.stderr)

    def successful_needs(self, selected=True):
        return {'workflow-tests': {'result': 'success', 'outputs': self.plan('true' if selected else 'false')},
                'backend': {'result': 'success' if selected else 'skipped',
                            'outputs': {'artifact-name': 'generated-files-tested-sha'} if selected else {}}}

    def test_planned_skip_and_selected_success_pass(self):
        for selected in [False, True]:
            self.run_gate('test', self.successful_needs(selected), True)

    def test_missing_failed_cancelled_or_skipped_planner_cannot_pass(self):
        self.run_gate('test', {}, False)
        for state in ['failure', 'cancelled', 'skipped', '']:
            payload = self.successful_needs(False)
            payload['workflow-tests']['result'] = state
            self.run_gate('test', payload, False)

    def test_selected_work_must_succeed_and_unselected_work_must_skip(self):
        for selected in [False, True]:
            for state in ['success', 'failure', 'cancelled', 'skipped', '']:
                payload = self.successful_needs(selected)
                payload['backend']['result'] = state
                self.run_gate('test', payload, state == ('success' if selected else 'skipped'))

    def test_successful_backend_requires_artifact(self):
        payload = self.successful_needs(); payload['backend']['outputs'] = {}
        self.run_gate('test', payload, False)

    def test_output_validation_rejects_empty_malformed_and_inconsistent_plans(self):
        self.run_gate('plan', self.plan(), True)
        for bad in [{}, None, [], {'backend': 'false'}, {**self.plan(), 'backend': 'false'},
                    {**self.plan(), 'oauth': True}, {**self.plan(), 'schema': ''}]:
            self.run_gate('plan', bad, False)
            payload = self.successful_needs(False); payload['workflow-tests']['outputs'] = bad
            self.run_gate('test', payload, False)


class WiringTests(unittest.TestCase):
    def load(self, name):
        return yaml.safe_load((ROOT / '.github/workflows' / name).read_text())

    def test_required_test_keeps_its_name_and_cd_artifact_contract(self):
        workflow = self.load('continuous-integration.yml'); jobs = workflow['jobs']
        gate = jobs['test']
        self.assertEqual(gate['if'], '${{ always() }}')
        self.assertCountEqual(gate['needs'], ['workflow-tests', 'backend'])
        self.assertNotIn('services', gate)
        step = next(s for s in gate['steps'] if s.get('name') == 'Validate selected CI results')
        self.assertEqual(step['run'], 'python3 .github/scripts/check-ci-result.py test')
        self.assertEqual(step['env']['NEEDS_JSON'], '${{ toJSON(needs) }}')
        self.assertEqual(gate['outputs']['artifact-name'], '${{ needs.backend.outputs.artifact-name }}')
        triggers = workflow.get('on', workflow.get(True))
        self.assertEqual(triggers['workflow_call']['outputs']['generated-files-artifact']['value'], '${{ jobs.test.outputs.artifact-name }}')
        self.assertIn('schedule', triggers)
        self.assertIn('workflow_dispatch', triggers)
        self.assertEqual(jobs['backend']['needs'], 'workflow-tests')
        self.assertEqual(jobs['backend']['if'], "needs.workflow-tests.outputs.backend == 'true'")
        self.assertFalse(jobs['backend'].get('continue-on-error', False))

    def test_planner_runs_before_install_and_validates_every_output(self):
        job = self.load('continuous-integration.yml')['jobs']['workflow-tests']
        self.assertNotIn('if', job)
        self.assertNotIn('services', job)
        steps = job['steps']
        self.assertEqual(steps[0]['with']['fetch-depth'], 0)
        selector = next(s for s in steps if s.get('id') == 'select')
        validator = next(s for s in steps if s.get('name') == 'Validate CI selection')
        self.assertNotIn('if', selector); self.assertNotIn('if', validator)
        self.assertEqual(validator['run'], 'python3 .github/scripts/check-ci-result.py plan')
        self.assertEqual(validator['env']['PLAN_JSON'], '${{ toJSON(steps.select.outputs) }}')
        self.assertEqual(selector['env'], {'EVENT_NAME':'${{ github.event_name }}',
            'BASE_SHA':'${{ github.event.pull_request.base.sha }}', 'HEAD_SHA':'${{ github.event.pull_request.head.sha }}'})
        for key in ['backend','oauth','schema','workflows']:
            self.assertEqual(job['outputs'][key], '${{ steps.select.outputs.' + key + ' }}')
        for step in steps[steps.index(validator)+1:]:
            self.assertEqual(step['if'], "steps.select.outputs.workflows == 'true'")

    def test_schema_required_check_stays_unconditional_and_heavy_steps_are_selected(self):
        workflow = self.load('schema-drift.yml'); job = workflow['jobs']['check']
        self.assertEqual(job['name'], 'Compare SQL ↔ Prisma schemas')
        self.assertNotIn('if', job); self.assertNotIn('services', job)
        steps = job['steps']; validator = next(s for s in steps if s.get('name') == 'Validate CI selection')
        self.assertEqual(steps[0]['with']['fetch-depth'], 0)
        self.assertNotIn('if', validator)
        self.assertEqual(validator['run'], 'python3 .github/scripts/check-ci-result.py plan')
        for step in steps[steps.index(validator)+1:]:
            if step.get('name') == 'Send drift alert to Discord':
                continue
            self.assertIn("steps.select.outputs.schema == 'true'", step['if'], step)
            self.assertFalse(step.get('continue-on-error', False))
        triggers = workflow.get('on', workflow.get(True))
        self.assertIn('schedule', triggers); self.assertIn('workflow_dispatch', triggers)
        self.assertEqual(workflow['jobs']['journeys']['needs'], 'check')


    def test_scheduled_failures_alert_even_before_selection_outputs_exist(self):
        steps = self.load('schema-drift.yml')['jobs']['check']['steps']
        alert = next(step for step in steps if step.get('name') == 'Send drift alert to Discord')
        # Evaluate the actual job expression against the scheduling truth table.
        # failure() is necessary to override GitHub's default success() condition.
        self.assertIn('failure()', alert['if'])
        condition = (alert['if'].replace('failure()', 'failed')
                     .replace('github.event_name', 'event')
                     .replace('steps.select.outputs.schema', 'schema')
                     .replace('&&', 'and').replace('||', 'or'))
        for schema in ['', 'false', 'true']:
            for event in ['schedule', 'pull_request', 'workflow_dispatch']:
                for failed in [False, True]:
                    with self.subTest(schema=schema, event=event, failed=failed):
                        should_alert = failed and event == 'schedule'
                        selected = eval(condition, {'__builtins__': {}},
                                        {'schema': schema, 'event': event, 'failed': failed})
                        self.assertEqual(selected, should_alert)
                        if selected:
                            # Exercise the notification shell with an isolated curl stub.
                            with tempfile.TemporaryDirectory() as directory:
                                directory = Path(directory)
                                curl = directory / 'curl'
                                curl.write_text('#!/bin/sh\nprintf called > "$CALLED"\n')
                                curl.chmod(0o755)
                                command = re.sub(r'\$\{\{.*?\}\}', 'synthetic', alert['run'])
                                result = subprocess.run(['bash', '-eo', 'pipefail', '-c', command],
                                    env={**os.environ, 'PATH': f"{directory}:{os.environ['PATH']}",
                                         'CALLED': str(directory / 'called')},
                                    capture_output=True, text=True, timeout=5)
                                self.assertEqual(result.returncode, 0, result.stderr)
                                self.assertEqual((directory / 'called').read_text(), 'called')


if __name__ == '__main__':
    unittest.main()
