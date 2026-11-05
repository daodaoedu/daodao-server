import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm, symlink, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fake = `#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const home=process.env.FIXTURE,a=process.argv.slice(2),tool=path.basename(process.argv[1]);
const event={tool,args:a,url:process.env.DATABASE_URL,password:process.env.POSTGRES_PASSWORD,prompt:process.env.GIT_TERMINAL_PROMPT};
fs.appendFileSync(home+'/events',JSON.stringify(event)+'\\n');
const mode=process.env.MODE||'',id='a'.repeat(64),state=home+'/container';
const out=x=>process.stdout.write(x+'\\n'),fail=n=>process.exit(n);
if(tool==='git'){
 if(a.includes('fetch')&&mode==='git-fail')fail(28);
 if(a.includes('archive')){cp.execFileSync('tar',['-cf',a[a.indexOf('--output')+1],'-C',home+'/source','schema']);}
 else if(a[0]==='init')fs.mkdirSync(a.at(-1),{recursive:true});
 else out('fake git');
}else if(tool==='pnpm'){
 if(a[0]==='test'){
  fs.writeFileSync(home+'/testing','yes');
  out(process.env.DATABASE_URL);out(new URL(process.env.DATABASE_URL).password);
  if(mode==='hang'){process.on('SIGTERM',()=>{fs.writeFileSync(home+'/stopped','yes');process.exit(0)});setInterval(()=>{},1000);}
  else fail(mode==='exit37'?37:0);
 }else if(a.includes('types:generate')&&mode==='types-fail')fail(31);
 else out('fake pnpm');
}else{
 if(a[0]==='context')out(process.env.ENDPOINT||'unix:///var/run/docker.sock');
 else if(a[0]==='version'){if(mode==='daemon-fail')fail(21);out('16');}
 else if(a[0]==='create'){
  const label=a[a.indexOf('--label')+1].split('=')[1];fs.writeFileSync(state,label);
  if(mode==='create-signal'){fs.writeFileSync(home+'/creating','yes');setTimeout(()=>{fs.writeFileSync(a[a.indexOf('--cidfile')+1],id);out(id)},300);return;}
  if(mode==='partial')fail(29);
  fs.writeFileSync(a[a.indexOf('--cidfile')+1],id);out(id);
 }else if(a[0]==='start'){if(mode==='start-fail')fail(23);out(id);}
 else if(a[0]==='port')out('127.0.0.1:56400');
 else if(a[0]==='exec'){
  if(a.includes('pg_isready'))fail(mode==='not-ready'?1:0);
  if(mode==='bootstrap-fail')fail(27);
  if(a.includes('-At'))out('0');
  else process.stdin.resume();
 }else if(a[0]==='ps'){if(mode==='ps-fail')fail(25);if(fs.existsSync(state))out(id);}
 else if(a[0]==='inspect'){if(mode==='inspect-fail'){process.stderr.write('daemon unavailable');fail(26)}out(mode==='foreign-label'?'another-run':fs.readFileSync(state,'utf8'));}
 else if(a[0]==='rm'){if(a.at(-1)!==id)throw Error('foreign resource removal');if(mode==='hang'&&!fs.existsSync(home+'/stopped'))throw Error('removed before test child stopped');fs.unlinkSync(state);fs.writeFileSync(home+'/removed','yes');}
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
  const env = { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`, FIXTURE: dir, MODE: mode, DATABASE_URL: 'postgresql://external:secret@production.invalid/live', ...extra };
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
