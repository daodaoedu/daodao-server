import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm, symlink, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fake = `#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const home=process.env.FIXTURE,a=process.argv.slice(2),tool=path.basename(process.argv[1]);
const event={tool,args:a,url:process.env.DATABASE_URL,password:process.env.POSTGRES_PASSWORD,prompt:process.env.GIT_TERMINAL_PROMPT,oauth:process.env.OAUTH_INTEGRATION_TEST,oauthDb:process.env.OAUTH_TEST_DATABASE_URL,oauthRedis:process.env.OAUTH_TEST_REDIS_URL,oauthSmtp:process.env.OAUTH_TEST_SMTP_PORT,oauthMailpit:process.env.OAUTH_TEST_MAILPIT_URL,oauthRunId:process.env.OAUTH_TEST_RUN_ID,oauthPostgresId:process.env.OAUTH_TEST_POSTGRES_CONTAINER_ID,oauthRedisId:process.env.OAUTH_TEST_REDIS_CONTAINER_ID,oauthMailpitId:process.env.OAUTH_TEST_MAILPIT_CONTAINER_ID,nodeEnv:process.env.NODE_ENV,redisUrl:process.env.REDIS_URL,smtpHost:process.env.SMTP_HOST,emailPassword:process.env.EMAIL_PASSWORD,googleSecret:process.env.GOOGLE_CLIENT_SECRET};
fs.appendFileSync(home+'/events',JSON.stringify(event)+'\\n');
const mode=process.env.MODE||'',state=home+'/container';
const containers=()=>fs.existsSync(state)?JSON.parse(fs.readFileSync(state,'utf8')):{};
const save=x=>Object.keys(x).length?fs.writeFileSync(state,JSON.stringify(x)):fs.unlinkSync(state);
const out=x=>process.stdout.write(x+'\\n'),fail=n=>process.exit(n);
if(tool==='git'){
 if(a.includes('fetch')&&mode==='git-fail')fail(28);
 if(a.includes('archive')){cp.execFileSync('tar',['-cf',a[a.indexOf('--output')+1],'-C',home+'/source','schema']);}
 else if(a[0]==='init')fs.mkdirSync(a.at(-1),{recursive:true});
 else out('fake git');
}else if(tool==='pnpm'){
 if(a[0]==='test'||a[1]==='test:oauth:integration'){
  if(mode==='hang'||mode==='oauth-hang'){process.on('SIGTERM',()=>{fs.writeFileSync(home+'/stopped','yes');process.exit(0)});setInterval(()=>{},1000);}
  fs.writeFileSync(home+'/testing','yes');
  out(process.env.DATABASE_URL);out(new URL(process.env.DATABASE_URL).password);
  if(mode!=='hang'&&mode!=='oauth-hang')fail(mode==='exit37'?37:0);
 }else if(a.includes('types:generate')&&mode==='types-fail')fail(31);
 else out('fake pnpm');
}else{
 if(a[0]==='context')out(process.env.ENDPOINT||'unix:///var/run/docker.sock');
 else if(a[0]==='version'){if(mode==='daemon-fail')fail(21);out('16');}
 else if(a[0]==='create'){
  const rows=containers(),id=String.fromCharCode(97+Object.keys(rows).length).repeat(64),image=a.at(-1);
  const label=a[a.indexOf('--label')+1].split('=')[1];rows[id]={label,image};save(rows);
  const signaling=mode==='create-signal'||(mode==='oauth-create-signal'&&image.startsWith('redis:'));
  if(signaling){fs.writeFileSync(home+'/creating','yes');setTimeout(()=>{fs.writeFileSync(a[a.indexOf('--cidfile')+1],id);out(id)},300);return;}
  if(mode==='partial')fail(29);
  if(mode==='oauth-late-create'&&image.startsWith('redis:')){
    delete rows[id];save(rows);fs.writeFileSync(home+'/late-create',JSON.stringify({id,label,image}));fail(34);
  }
  if(mode==='redis-create-fail'&&image.startsWith('redis:'))fail(32);
  if(mode==='mailpit-create-fail'&&image.startsWith('axllent/'))fail(33);
  fs.writeFileSync(a[a.indexOf('--cidfile')+1],id);out(id);
 }else if(a[0]==='start'){if(mode==='start-fail')fail(23);out(a[1]);}
 else if(a[0]==='port')out('127.0.0.1:'+(a[2]==='1025/tcp'?process.env.FIXTURE_SMTP_PORT:a[2]==='6379/tcp'?'56401':a[2]==='8025/tcp'?'56402':'56400'));
 else if(a[0]==='exec'){
  if(a.includes('pg_isready'))fail(mode==='not-ready'?1:0);
  if(a.includes('redis-cli')){
    if(mode==='redis-slow-ping'){setTimeout(()=>out('PONG'),5400);return;}
    out(mode==='redis-not-ready'?'LOADING':'PONG');return;
  }
  if(mode==='bootstrap-fail')fail(27);
  if(a.includes('-At'))out('0');
  else process.stdin.resume();
 }else if(a[0]==='ps'){
  if(mode==='ps-fail')fail(25);
  if(fs.existsSync(home+'/late-create')){
    if(fs.existsSync(home+'/queried-late')){const row=JSON.parse(fs.readFileSync(home+'/late-create','utf8')),rows=containers();rows[row.id]={label:row.label,image:row.image};save(rows);fs.unlinkSync(home+'/late-create');}
    else fs.writeFileSync(home+'/queried-late','yes');
  }
  for(const id of Object.keys(containers()))out(id);
 }
 else if(a[0]==='inspect'){if(mode==='inspect-fail'){process.stderr.write('daemon unavailable');fail(26)}const row=containers()[a.at(-1)];if(!row){process.stderr.write('No such container');fail(1)}out(mode==='foreign-label'?'another-run':row.label);}
 else if(a[0]==='rm'){const rows=containers(),id=a.at(-1);if(!rows[id])throw Error('foreign resource removal');if((mode==='hang'||mode==='oauth-hang')&&!fs.existsSync(home+'/stopped'))throw Error('removed before test child stopped');delete rows[id];save(rows);fs.writeFileSync(home+'/removed','yes');}
}
`;

async function fixture(t, mode = '', args = [], extra = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'runner-regression-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await Promise.all(['scripts', '.github/scripts', 'bin', 'source/schema'].map(name => mkdir(path.join(dir, name), { recursive: true })));
  await Promise.all([
    copyFile(path.join(root, 'scripts/test-local.mjs'), path.join(dir, 'scripts/test-local.mjs')),
    copyFile(path.join(root, '.github/scripts/init-test-database.sh'), path.join(dir, '.github/scripts/init-test-database.sh')),
    copyFile(path.join(root, '.github/test-database.json'), path.join(dir, '.github/test-database.json')),
    writeFile(path.join(dir, 'source/schema/001.sql'), 'SELECT 1;'),
    writeFile(path.join(dir, 'fake.cjs'), fake, { mode: 0o755 }),
  ]);
  for (const tool of ['docker', 'git', 'pnpm']) await symlink(path.join(dir, 'fake.cjs'), path.join(dir, 'bin', tool));
  await writeFile(path.join(dir, 'foreign-container'), 'unrelated ownership');
  if (extra.CONFIG !== undefined) await writeFile(path.join(dir, '.github/test-database.json'), JSON.stringify(extra.CONFIG));
  let smtpPort;
  if (args.includes('--oauth')) {
    const smtp = createServer(socket => {
      if (mode === 'smtp-wait') { void writeFile(path.join(dir, 'smtp-connecting'), 'yes'); return; }
      socket.end(mode === 'smtp-not-ready' ? '500 not SMTP ready\r\n' : '220 fixture SMTP ready\r\n');
    });
    await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve));
    smtpPort = smtp.address().port;
    t.after(() => new Promise(resolve => smtp.close(resolve)));
  }
  const env = { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`, FIXTURE: dir, MODE: mode, FIXTURE_SMTP_PORT: String(smtpPort || ''), DATABASE_URL: 'postgresql://external:secret@production.invalid/live', ...extra };
  delete env.DOCKER_HOST; delete env.DOCKER_CONTEXT;
  Object.assign(env, extra);
  const child = spawn(process.execPath, [path.join(dir, 'scripts/test-local.mjs'), ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
  const watchdog = setTimeout(() => child.kill('SIGKILL'), 20000);
  child.once('close', () => clearTimeout(watchdog));
  const completed = new Promise((resolve, reject) => { child.on('error', reject); child.on('close', (code, signal) => resolve({ code, signal, output })); });
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  return { dir, child, completed, events: async () => (await readFile(path.join(dir, 'events'), 'utf8').catch(() => '')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) };
}
async function exists(name) { try { await access(name); return true; } catch { return false; } }
async function assertClean(f) {
  assert.equal(await readFile(path.join(f.dir, 'foreign-container'), 'utf8'), 'unrelated ownership');
  assert.equal(await exists(path.join(f.dir, 'container')), false);
  assert.equal(await exists(path.join(f.dir, 'late-create')), false);
  const create = (await f.events()).find(e => e.tool === 'docker' && e.args[0] === 'create');
  if (create) assert.equal(await exists(path.dirname(create.args[create.args.indexOf('--cidfile') + 1])), false);
}

test('full CLI owns its database, redacts secrets, forwards Jest arguments and cleans resources', async t => {
  const f = await fixture(t, '', ['--', '--runInBand']);
  const result = await f.completed;
  assert.equal(result.code, 0, result.output);
  const events = await f.events(), tests = events.find(e => e.tool === 'pnpm' && e.args[0] === 'test');
  assert.deepEqual(tests.args, ['test', '--runInBand']);
  assert.match(tests.url, /^postgresql:\/\/test:[\w-]+@127\.0\.0\.1:56400\/daodao_test$/);
  assert.equal(result.output.includes(tests.url), false);
  assert.equal(result.output.includes(new URL(tests.url).password), false);
  assert.equal(events.some(e => e.url?.includes('production.invalid')), false);
  assert.equal(events.filter(e => e.tool === 'git').every(e => e.prompt === '0'), true);
  const create = events.find(e => e.args[0] === 'create');
  assert.equal(create.args.includes(create.password), false);
  assert.equal(create.args.includes('127.0.0.1::5432'), true);
  assert.equal(events.find(e => e.tool === 'docker' && e.args[0] === 'rm').args.includes('-v'), true);
  assert.match(result.output, /Run ownership ID: [a-f0-9-]{36}/);
  await assertClean(f);
});

test('integration CLI uses the pinned local Git commit without fetching', async t => {
  const f = await fixture(t, '', ['--integration', '--schema-repo', '/local/schema', '--', '--verbose']);
  assert.equal((await f.completed).code, 0);
  const events = await f.events();
  assert.deepEqual(events.find(e => e.tool === 'pnpm' && e.args[0] === 'test').args, ['test', 'tests/integration', '--verbose']);
  assert.equal(events.some(e => e.args.includes('fetch')), false);
  assert.equal(events.some(e => e.args.includes('cat-file')), true);
  await assertClean(f);
});

for (const [mode, code] of [['exit37',37], ['bootstrap-fail',27], ['partial',29], ['types-fail',31], ['start-fail',23], ['git-fail',28], ['daemon-fail',21]]) {
  test(`${mode} preserves the failing command exit and cleans owned resources`, async t => {
    const f = await fixture(t, mode), result = await f.completed;
    assert.equal(result.code, code, result.output);
    if (mode !== 'exit37') assert.equal((await f.events()).some(e => e.tool === 'pnpm' && e.args[0] === 'test'), false);
    await assertClean(f);
  });
}

test('readiness has a total timeout and does not run tests', async t => {
  const f = await fixture(t, 'not-ready', ['--ready-timeout-ms', '150']);
  assert.equal((await f.completed).code, 1);
  assert.equal((await f.events()).some(e => e.tool === 'pnpm' && e.args[0] === 'test'), false);
  await assertClean(f);
});

for (const extra of [{ DOCKER_HOST: 'tcp://remote.invalid:2375' }, { ENDPOINT: 'ssh://remote.invalid' }]) {
  test(`remote Docker endpoint fails before creating resources: ${JSON.stringify(extra)}`, async t => {
    const f = await fixture(t, '', [], extra), result = await f.completed;
    assert.equal(result.code, 1); assert.match(result.output, /Remote Docker contexts/);
    assert.equal((await f.events()).some(e => e.args[0] === 'create' || e.tool === 'pnpm'), false);
  });
}

for (const signal of ['SIGINT','SIGTERM']) {
  test(`${signal} waits for the owned test process to stop before cleanup`, async t => {
    const f = await fixture(t, 'hang');
    const deadline = Date.now()+10000;
    while (!await exists(path.join(f.dir, 'testing'))) { assert.ok(Date.now()<deadline); await new Promise(resolve=>setTimeout(resolve,20)); }
    f.child.kill(signal);
    const result=await f.completed;
    assert.equal(result.code,signal==='SIGINT'?130:143,result.output);
    assert.equal(await exists(path.join(f.dir,'stopped')),true);
    await assertClean(f);
  });
}

for (const mode of ['inspect-fail', 'ps-fail']) {
  test(`${mode} cannot silently claim successful cleanup`, async t => {
    const f = await fixture(t, mode), result=await f.completed;
    assert.equal(result.code,1);assert.match(result.output,/Cleanup failed/);
    if(mode==='ps-fail') await assertClean(f);
  });
}

test('help and import are side-effect free', async t => {
  const f=await fixture(t,'',['--help']);assert.equal((await f.completed).code,0);assert.deepEqual(await f.events(),[]);
  const module=await import('../test-local.mjs');assert.equal(typeof module.runLocal,'function');
});

const validConfig = JSON.parse(await readFile(path.join(root, '.github/test-database.json'), 'utf8'));
for (const config of [null, [], ...[{postgresImage:'postgres:latest'}, {storageRepository:'other/repo'}, {storageRef:'main'}, {schemaDirectory:'other'}].map(patch => ({...validConfig,...patch}))]) {
  test(`invalid manifest fails before provisioning: ${JSON.stringify(config)}`, async t => {
    const f=await fixture(t,'',[],{CONFIG:config});assert.equal((await f.completed).code,1);assert.deepEqual(await f.events(),[]);
  });
}
test('signal during Docker create waits for daemon ID and removes only its owned container', async t => {
  const f=await fixture(t,'create-signal');
  const deadline=Date.now()+10000;
  while(!await exists(path.join(f.dir,'creating'))){assert.ok(Date.now()<deadline);await new Promise(resolve=>setTimeout(resolve,20));}
  f.child.kill('SIGTERM');assert.equal((await f.completed).code,143);
  assert.equal((await f.events()).some(e=>e.args[0]==='rm'),true);await assertClean(f);
});

test('a container with another ownership label is refused and retained', async t => {
  const f=await fixture(t,'foreign-label'),result=await f.completed;
  assert.equal(result.code,1);assert.match(result.output,/Refusing to remove/);
  assert.equal((await f.events()).some(e=>e.args[0]==='rm'),false);
  assert.equal(await exists(path.join(f.dir,'container')),true);
});


test('OAuth CLI provisions three owned local services, ignores inherited endpoints and forwards the suite command', async t => {
  const f = await fixture(t, '', ['--oauth', '--schema-repo', '/local/schema', '--', '--runInBand'], {
    REDIS_URL: 'redis://remote.invalid:6379/0', SMTP_HOST: 'smtp.remote.invalid',
    EMAIL_PASSWORD: 'external-mail-secret', GOOGLE_CLIENT_SECRET: 'external-google-secret',
    OAUTH_TEST_DATABASE_URL: 'postgresql://external:secret@production.invalid/live',
    OAUTH_TEST_REDIS_URL: 'redis://remote.invalid:6379/1', OAUTH_TEST_SMTP_PORT: '25',
    OAUTH_TEST_MAILPIT_URL: 'https://remote.invalid/mailpit',
    OAUTH_TEST_RUN_ID: 'inherited-oauth-run', OAUTH_TEST_POSTGRES_CONTAINER_ID: 'foreign-postgres-id',
    OAUTH_TEST_REDIS_CONTAINER_ID: 'foreign-redis-id', OAUTH_TEST_MAILPIT_CONTAINER_ID: 'foreign-mailpit-id',
  });
  const result = await f.completed;
  assert.equal(result.code, 0, result.output);
  const events = await f.events();
  const run = events.find(e => e.tool === 'pnpm' && e.args[1] === 'test:oauth:integration');
  assert.deepEqual(run.args, ['run', 'test:oauth:integration', '--runInBand']);
  assert.equal(run.oauth, '1'); assert.equal(run.nodeEnv, 'test');
  assert.equal(run.oauthDb, run.url);
  assert.match(run.oauthDb, /^postgresql:\/\/test:[\w-]+@127\.0\.0\.1:56400\/daodao_test$/);
  assert.equal(run.oauthRedis, 'redis://127.0.0.1:56401/0');
  assert.equal(run.oauthMailpit, 'http://127.0.0.1:56402');
  assert.match(run.oauthSmtp, /^[0-9]+$/); assert.ok(Number(run.oauthSmtp) > 1024);
  for (const event of events) {
    assert.equal(event.redisUrl, undefined); assert.equal(event.smtpHost, undefined);
    assert.equal(event.emailPassword, undefined); assert.equal(event.googleSecret, undefined);
    assert.equal(JSON.stringify(event).includes('remote.invalid'), false);
    assert.equal(JSON.stringify(event).includes('production.invalid'), false);
  }
  const creates = events.filter(e => e.tool === 'docker' && e.args[0] === 'create');
  assert.equal(creates.length, 3);
  const started = events.filter(e => e.tool === 'docker' && e.args[0] === 'start').map(e => e.args[1]);
  assert.deepEqual([run.oauthPostgresId, run.oauthRedisId, run.oauthMailpitId], started);
  assert.match(run.oauthRunId, /^[a-f0-9-]{36}$/);
  assert.equal(creates.every(e => e.args[e.args.indexOf('--label') + 1] === `io.daodao.local-tests=${run.oauthRunId}`), true);
  for (const inherited of ['inherited-oauth-run', 'foreign-postgres-id', 'foreign-redis-id', 'foreign-mailpit-id']) {
    assert.equal(events.some(e => JSON.stringify(e).includes(inherited)), false);
  }
  assert.equal(new Set(creates.map(e => e.args[e.args.indexOf('--cidfile') + 1])).size, 3);
  assert.deepEqual(creates.map(e => e.args.at(-1)), [validConfig.postgresImage, 'redis:7-alpine', 'axllent/mailpit:v1.29.0']);
  assert.equal(creates.every(e => e.args.some(a => /^127\.0\.0\.1::(5432|6379|1025)$/.test(a))), true);
  assert.equal(creates[2].args.includes('127.0.0.1::8025'), true);
  assert.equal(events.filter(e => e.tool === 'docker' && e.args[0] === 'rm').length, 3);
  assert.equal(result.output.includes(run.url), false);
  assert.equal(result.output.includes(new URL(run.url).password), false);
  await assertClean(f);
});

for (const [mode, code, containers] of [['exit37', 37, 3], ['redis-create-fail', 32, 2], ['mailpit-create-fail', 33, 3]]) {
  test(`OAuth ${mode} propagates failure and cleans all owned partial resources`, async t => {
    const f = await fixture(t, mode, ['--oauth']), result = await f.completed;
    assert.equal(result.code, code, result.output);
    const events = await f.events();
    assert.equal(events.filter(e => e.tool === 'docker' && e.args[0] === 'rm').length, containers);
    if (mode !== 'exit37') assert.equal(events.some(e => e.args[1] === 'test:oauth:integration'), false);
    await assertClean(f);
  });
}

for (const mode of ['redis-not-ready', 'smtp-not-ready']) {
  test(`OAuth ${mode} is bounded and fails before tests`, async t => {
    const f = await fixture(t, mode, ['--oauth', '--ready-timeout-ms', '200']), result = await f.completed;
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /did not become ready/);
    assert.equal((await f.events()).some(e => e.args[1] === 'test:oauth:integration'), false);
    await assertClean(f);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`OAuth ${signal} waits for the suite child then removes all three owned services`, async t => {
    const f = await fixture(t, 'oauth-hang', ['--oauth']);
    const deadline = Date.now() + 10000;
    while (!await exists(path.join(f.dir, 'testing'))) { assert.ok(Date.now() < deadline); await new Promise(resolve => setTimeout(resolve, 20)); }
    f.child.kill(signal);
    assert.equal((await f.completed).code, signal === 'SIGINT' ? 130 : 143);
    assert.equal(await exists(path.join(f.dir, 'stopped')), true);
    assert.equal((await f.events()).filter(e => e.tool === 'docker' && e.args[0] === 'rm').length, 3);
    await assertClean(f);
  });
}

test('OAuth interruption during Redis create recovers its ID and cleans both owned services', async t => {
  const f = await fixture(t, 'oauth-create-signal', ['--oauth']);
  const deadline = Date.now() + 10000;
  while (!await exists(path.join(f.dir, 'creating'))) { assert.ok(Date.now() < deadline); await new Promise(resolve => setTimeout(resolve, 20)); }
  f.child.kill('SIGTERM');
  assert.equal((await f.completed).code, 143);
  assert.equal((await f.events()).filter(e => e.tool === 'docker' && e.args[0] === 'rm').length, 2);
  await assertClean(f);
});

test('OAuth and existing integration selectors cannot be combined', async t => {
  const f = await fixture(t, '', ['--oauth', '--integration']);
  assert.equal((await f.completed).code, 1); assert.deepEqual(await f.events(), []);
});


test('OAuth interruption while waiting for SMTP closes its probe and cleans every service', async t => {
  const f = await fixture(t, 'smtp-wait', ['--oauth']);
  const deadline = Date.now() + 10000;
  while (!await exists(path.join(f.dir, 'smtp-connecting'))) { assert.ok(Date.now() < deadline); await new Promise(resolve => setTimeout(resolve, 20)); }
  f.child.kill('SIGTERM');
  const result = await f.completed;
  assert.equal(result.code, 143, result.output);
  assert.equal((await f.events()).filter(e => e.tool === 'docker' && e.args[0] === 'rm').length, 3);
  await assertClean(f);
});


test('OAuth cleanup waits for a late auxiliary Docker create even when PostgreSQL is already known', async t => {
  const f = await fixture(t, 'oauth-late-create', ['--oauth']);
  const result = await f.completed;
  assert.equal(result.code, 34, result.output);
  assert.equal((await f.events()).filter(e => e.tool === 'docker' && e.args[0] === 'rm').length, 2);
  await assertClean(f);
});


test('OAuth Redis readiness may take longer than five seconds within its configured budget', async t => {
  const f = await fixture(t, 'redis-slow-ping', ['--oauth', '--ready-timeout-ms', '12000']);
  const result = await f.completed;
  assert.equal(result.code, 0, result.output);
  assert.equal((await f.events()).some(e => e.args[1] === 'test:oauth:integration'), true);
  await assertClean(f);
});
