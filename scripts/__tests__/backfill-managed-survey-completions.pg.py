"""Exercise the reviewed helper on an independent disposable local DB, never the shared fixture DB."""
import hashlib
import hmac
import json
import os
from pathlib import Path
import subprocess
from urllib.parse import urlparse, urlunparse
import uuid

ROOT = Path(__file__).resolve().parents[2]
base = urlparse(os.environ.get('MANAGED_SURVEY_TEST_DATABASE_URL', ''))
if base.hostname != '127.0.0.1' or base.port != 16529 or base.path != '/survey529':
    raise RuntimeError('Requires the isolated #529 PostgreSQL container')
container = 'daodao-survey529-integration-pg'
database = 'completion_helper_' + uuid.uuid4().hex
key = '11' * 32  # Public test vector only; never uses a deployment secret.

def sql(query):
    return subprocess.check_output(['docker', 'exec', container, 'psql', '-U', 'postgres', '-d', database, '-Atc', query], text=True).strip()

def run(apply=False, supplied_key=key, include_database=True):
    env = {name: value for name, value in os.environ.items() if name in ('PATH', 'HOME', 'TMPDIR', 'SHELL', 'USER')}
    env.update({'SURVEY_COMPLETION_HMAC_KEY': supplied_key, 'NODE_ENV': 'test'})
    if include_database:
        env['DATABASE_URL'] = urlunparse(base._replace(path='/' + database))
    command = ['pnpm', 'exec', 'ts-node', '--transpile-only', '-r', 'tsconfig-paths/register', 'scripts/backfill-managed-survey-completions.ts', '--migration', '../daodao-storage/migrate/sql/105_blind_managed_survey_completions.sql']
    result = subprocess.run(command + (['--apply'] if apply else []), cwd=ROOT, env=env, capture_output=True, text=True, timeout=40)
    assert supplied_key not in result.stdout + result.stderr, 'Helper logged key material'
    return result

subprocess.run(['docker', 'exec', container, 'createdb', '-U', 'postgres', database], check=True)
try:
    sql('CREATE TABLE users(id INT PRIMARY KEY); CREATE TABLE surveys(id INT PRIMARY KEY,managed_version INT); INSERT INTO users VALUES(1),(2); INSERT INTO surveys VALUES(529,1); CREATE TABLE managed_survey_completions(survey_id INT REFERENCES surveys(id),user_id INT REFERENCES users(id),PRIMARY KEY(survey_id,user_id)); INSERT INTO managed_survey_completions VALUES(529,1),(529,2); CREATE TABLE survey_answers(id INT PRIMARY KEY,payload TEXT); INSERT INTO survey_answers VALUES(1,\'preserve this answer\');')
    before = sql('SELECT jsonb_agg(to_jsonb(c) ORDER BY user_id) FROM managed_survey_completions c')
    answers = sql('SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM survey_answers a')
    dry = run()
    assert dry.returncode == 0 and not json.loads(dry.stdout)['applied']
    assert before == sql('SELECT jsonb_agg(to_jsonb(c) ORDER BY user_id) FROM managed_survey_completions c')
    assert sql("SELECT count(*) FROM information_schema.columns WHERE table_name='managed_survey_completions' AND column_name='completion_key'") == '0'
    print('PASS dry-run preserves rows and migration104 primary-key/schema')
    applied = run(True)
    assert applied.returncode == 0
    rows = json.loads(sql('SELECT jsonb_agg(to_jsonb(c) ORDER BY completion_key) FROM managed_survey_completions c'))
    expected = {hmac.new(bytes.fromhex(key), f'daodao:managed-survey-completion:v1\0{529}\0{user}'.encode(), hashlib.sha256).hexdigest() for user in (1, 2)}
    assert len(rows) == 2 and all(row['user_id'] is None for row in rows)
    assert {row['completion_key'] for row in rows} == expected
    assert answers == sql('SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM survey_answers a')
    again = run(True)
    assert again.returncode == 0 and json.loads(again.stdout)['blinded_rows'] == 0
    print('PASS transactional blinding/migration105 preserves answers and same-key dedup on rerun')
    assert run(True, 'bad-key').returncode != 0
    assert run(True, include_database=False).returncode != 0
    print('PASS malformed key and missing explicit database fail closed without identity/key logs')
    sql('DROP TABLE managed_survey_completions; CREATE TABLE managed_survey_completions(survey_id INT,user_id INT,completion_key VARCHAR(64),PRIMARY KEY(survey_id,user_id)); INSERT INTO managed_survey_completions VALUES(529,1,repeat(\'f\',64));')
    before_bad = sql('SELECT jsonb_agg(to_jsonb(c)) FROM managed_survey_completions c')
    assert run(True).returncode != 0
    assert before_bad == sql('SELECT jsonb_agg(to_jsonb(c)) FROM managed_survey_completions c')
    assert sql("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='managed_survey_completions'::regclass AND contype='p'") == 'PRIMARY KEY (survey_id, user_id)'
    print('PASS partial-key mismatch rolls back rows and original primary key without deleting data')
    sql('ALTER TABLE surveys DROP COLUMN managed_version')
    assert run(True).returncode != 0
    assert before_bad == sql('SELECT jsonb_agg(to_jsonb(c)) FROM managed_survey_completions c')
    print('PASS missing migration104 prerequisites are refused without data changes')
finally:
    subprocess.run(['docker', 'exec', container, 'dropdb', '-U', 'postgres', '--force', database], check=True)
