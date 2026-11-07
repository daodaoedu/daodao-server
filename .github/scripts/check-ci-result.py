#!/usr/bin/env python3
"""Fail required gates on missing plans, failures, cancellations or unexpected skips."""
import argparse
import json
import os

KEYS = ('backend', 'oauth', 'schema', 'workflows')


def validate_plan(outputs):
    """Require a complete, internally consistent selection before any planned skips."""
    if not isinstance(outputs, dict) or any(outputs.get(key) not in ('true', 'false') for key in KEYS):
        raise ValueError('CI plan is missing valid selection outputs')
    if outputs['oauth'] == 'true' and outputs['backend'] != 'true':
        raise ValueError('OAuth requires the backend worker')


def validate(needs):
    """Validate required work against the planner's explicit boolean outputs."""
    plan = needs.get('workflow-tests', {})
    if plan.get('result') != 'success':
        raise ValueError('CI planning or workflow validation did not succeed')
    outputs = plan.get('outputs', {})
    validate_plan(outputs)
    worker = needs.get('backend', {})
    expected = 'success' if outputs['backend'] == 'true' else 'skipped'
    if worker.get('result') != expected:
        raise ValueError(f'Backend result must be {expected}')
    if expected == 'success' and not worker.get('outputs', {}).get('artifact-name'):
        raise ValueError('Backend did not produce its required artifact')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('scope', choices=('plan', 'test'))
    args = parser.parse_args()
    try:
        if args.scope == 'plan':
            validate_plan(json.loads(os.environ['PLAN_JSON']))
        else:
            validate(json.loads(os.environ['NEEDS_JSON']))
    except (ValueError, KeyError, TypeError, AttributeError) as error:
        raise SystemExit(f'CI gate failed: {error}') from error
    print(f'{args.scope}: selected CI work passed (unselected work skipped explicitly)')


if __name__ == '__main__':
    main()
