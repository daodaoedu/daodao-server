const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const image = process.env.NONROOT_TEST_IMAGE || 'daodao334-reviewed:local';
const oldImage = process.env.NONROOT_OLD_TEST_IMAGE || 'daodao334-baseline:local';
const run = `dev506-${process.pid}-${Date.now()}`;
const label = `io.daodao.dev506=${run}`;
const volume = `${run}-data`;
const scripts = path.resolve(__dirname, '..');

/** Run only explicit local fixture Docker operations; never pull or contact a host. */
function docker(args, input, expected = 0) {
  const result = spawnSync('docker', args, {input, encoding: 'utf8', timeout: 45000});
  if (expected !== null) assert.equal(result.status, expected, result.stdout + result.stderr);
  return result;
}

/** Read a minimal runtime snapshot without environment or log content. */
function inspect(name) {
  return JSON.parse(docker(['inspect', '--format', '{{json .}}', name]).stdout);
}

/** Read the configured volume subpath, which Docker's simplified Mounts omits. */
function logMount(container) {
  const mount = container.HostConfig.Mounts.find(m => m.Target === '/app/logs');
  assert.equal(mount.Type, 'volume');
  assert.equal(mount.VolumeOptions.NoCopy, true);
  assert.ok(mount.VolumeOptions.Subpath, 'the actual configured subpath must be captured');
  return mount;
}

/** Execute a trusted fixture expression as root within the owned volume. */
function setup(code) {
  return docker(['run', '--rm', '--network', 'none', '--label', label, '--user', '0:0',
    '--mount', `type=volume,src=${volume},dst=/fixture`, '--entrypoint', 'node', image, '-e', code]);
}

/** Make an in-container HTTP request; no public port or network is configured. */
function request(name, route) {
  return JSON.parse(docker(['exec', name, 'node', '-e',
    `fetch('http://127.0.0.1:3000${route}').then(async r=>console.log(JSON.stringify({status:r.status,body:await r.json()}))).catch(()=>process.exit(2))`]).stdout);
}

/** Wait for the controlled fixture HTTP server, preserving failed status evidence. */
function ready(name, expected) {
  for (let i = 0; i < 30; i++) {
    const probe = docker(['exec', name, 'node', '-e',
      `fetch('http://127.0.0.1:3000/ready').then(r=>{console.log(r.status);process.exit(r.status===${expected}?0:1)}).catch(()=>process.exit(1))`], undefined, null);
    if (probe.status === 0) return;
    if (inspect(name).State.Status === 'exited') break;
    spawnSync('sleep', ['0.1']);
  }
  assert.fail(`fixture ${name} did not return ${expected}`);
}

const server = `
const fs=require('fs'),http=require('http'),winston=require('winston');
const Rotate=require('winston-daily-rotate-file');
if(process.env.MODE==='startup')process.exit(41);
try{fs.writeFileSync('/app/logs/'+process.env.MARKER,'synthetic');}catch{process.exit(42);}
let rotations=0;
const transport=new Rotate({filename:'/app/logs/'+process.env.PREFIX+'-combined-%DATE%.log',datePattern:'YYYY-MM-DD',maxSize:'1k',maxFiles:5,zippedArchive:true});
transport.on('rotate',()=>rotations++);
transport.on('error',()=>process.exit(42));
const logger=winston.createLogger({format:winston.format.json(),transports:[transport]});
logger.info('fixture-start');
const server=http.createServer((req,res)=>{
 if(req.url==='/rotate')for(let i=0;i<20;i++)logger.info('synthetic-'+i+'x'.repeat(120));
 const files=fs.readdirSync('/app/logs');
 res.writeHead(req.url==='/ready'&&process.env.MODE==='readiness'?503:200,{'content-type':'application/json'});
 res.end(JSON.stringify({uid:process.getuid(),rotations,files}));
});
server.listen(3000,'127.0.0.1');
process.on('SIGTERM',()=>server.close(()=>logger.end(()=>process.exit(0))));
`;

/** Start the controlled service with exactly one log subpath and a pinned image. */
function start(name, subpath, mode = 'healthy', candidate = image, user = '1000:1000') {
  docker(['run', '-d', '--name', name, '--network', 'none', '--label', label,
    '--no-healthcheck', '--user', user, '--mount', `type=volume,src=${volume},dst=/app/logs,volume-subpath=${subpath},volume-nocopy`,
    '-e', `MODE=${mode}`, '-e', `PREFIX=${name.includes('prod') ? 'prod' : 'dev'}`,
    '-e', `MARKER=${subpath === 'external/dev' ? 'new-dev.synthetic' : name.includes('prod') ? 'prod.synthetic' : 'old-dev.synthetic'}`,
    '--entrypoint', 'node', candidate, '-e', server]);
}

/** Delete only the exact resource name this test created. */
function remove(name) { docker(['rm', '-f', name], undefined, null); }

test('dev transition, actual Winston rotation, and fixed-image/original-mount rollback preserve legacy production', {timeout: 240000}, () => {
  docker(['image', 'inspect', image]);
  docker(['image', 'inspect', oldImage]);
  const names = ['prod', 'old', 'dev', 'bad-start', 'bad-ready', 'bad-log'].map(n => `${run}-${n}`);
  docker(['volume', 'create', '--label', label, volume]);
  try {
    setup(`const f=require('fs');f.mkdirSync('/fixture/external',{mode:0o755});f.mkdirSync('/fixture/checkout/logs',{recursive:true});f.writeFileSync('/fixture/checkout/logs/legacy-dev.synthetic','retained');f.writeFileSync('/fixture/checkout/logs/prod.synthetic','synthetic');f.writeFileSync('/fixture/effective.json',JSON.stringify({services:{dev_app:{volumes:[{type:'bind',source:'/fixture/external/dev',target:'/app/logs'}]},production_app:{volumes:[{type:'bind',source:'/fixture/checkout/logs',target:'/app/logs'}]},prod_app:{volumes:[{type:'bind',source:'/fixture/checkout/logs',target:'/app/logs'}]}}}));`);
    const prepare = ['run', '--rm', '--network', 'none', '--label', label, '--user', '0:0',
      '--mount', `type=volume,src=${volume},dst=/fixture`, '--mount', `type=bind,src=${scripts},dst=/checks,readonly`,
      '--entrypoint', 'node', image, '/checks/prepare-log-directory.cjs', '--config', '/fixture/effective.json',
      '--checkout', '/fixture/checkout', '--service', 'dev_app'];
    const dry = docker(prepare);
    assert.match(dry.stdout, /would-create/);
    setup(`const f=require('fs'),a=require('assert/strict');a.equal(f.existsSync('/fixture/external'),true);a.equal(f.existsSync('/fixture/external/dev'),false)`);
    assert.match(docker([...prepare, '--apply']).stdout, /created/);
    assert.match(docker([...prepare, '--apply']).stdout, /unchanged/);
    setup(`const f=require('fs'),a=require('assert/strict');const p=f.statSync('/fixture/external'),d=f.statSync('/fixture/external/dev');a.equal(p.uid,0);a.equal(p.mode&0o022,0);a.equal(d.uid,1000);a.equal(d.gid,1000);a.equal(d.mode&0o777,0o750);`);
    start(names[0], 'checkout/logs', 'healthy', oldImage, '0:0'); ready(names[0], 200);
    start(names[1], 'checkout/logs', 'healthy', oldImage, '0:0'); ready(names[1], 200);
    const production = inspect(names[0]);
    const original = inspect(names[1]);
    const fixedOldImage = original.Image;
    const originalSubpath = logMount(original).VolumeOptions.Subpath;
    assert.equal(originalSubpath, 'checkout/logs');
    start(names[2], 'external/dev'); ready(names[2], 200);
    assert.equal(request(names[2], '/ready').body.uid, 1000);
    assert.ok(!request(names[0], '/ready').body.files.includes('new-dev.synthetic'));
    assert.ok(!request(names[2], '/ready').body.files.includes('legacy-dev.synthetic'));
    request(names[2], '/rotate');
    const rotated = request(names[2], '/ready').body;
    assert.ok(rotated.rotations > 0, 'real Winston must rotate under UID1000');
    assert.ok(rotated.files.some(n => /dev-combined-.*\.log\./.test(n)), 'rotated files must exist');
    assert.ok(!request(names[0], '/ready').body.files.includes('new-dev.synthetic'));
    const probe = fs.readFileSync(path.join(scripts, 'preflight-container-logs.cjs'), 'utf8');
    docker(['run', '-i', '--rm', '--network', 'none', '--label', label, '--user', '1000:1000',
      '--mount', `type=volume,src=${volume},dst=/app/logs,volume-subpath=checkout/logs,readonly`,
      '-e', 'NODE_ENV=dev', '--entrypoint', 'node', image, '-'], probe, 1);
    assert.equal(inspect(names[1]).State.Running, true, 'preflight rejection must not stop the old fixture');
    remove(names[1]);
    start(names[3], 'external/dev', 'startup');
    start(names[4], 'external/dev', 'readiness'); ready(names[4], 503);
    setup(`const f=require('fs');f.mkdirSync('/fixture/unsafe');f.chmodSync('/fixture/unsafe',0o755);`);
    start(names[5], 'unsafe', 'healthy');
    for (const name of [names[3], names[5]]) {
      for (let i = 0; i < 30 && inspect(name).State.Running; i++) spawnSync('sleep', ['0.1']);
      assert.equal(inspect(name).State.Status, 'exited');
      assert.ok([41, 42].includes(inspect(name).State.ExitCode));
    }
    remove(names[3]); remove(names[4]); remove(names[5]);
    start(names[1], originalSubpath, 'healthy', fixedOldImage, '0:0'); ready(names[1], 200);
    const restored = inspect(names[1]);
    assert.equal(restored.Image, fixedOldImage);
    assert.deepEqual(restored.Mounts, original.Mounts);
    assert.deepEqual(logMount(restored), logMount(original));
    assert.equal(logMount(inspect(names[2])).VolumeOptions.Subpath, 'external/dev');
    const after = inspect(names[0]);
    assert.equal(after.Id, production.Id);
    assert.equal(after.Image, production.Image);
    assert.deepEqual(after.Mounts, production.Mounts);
    assert.equal(after.State.Running, true);
    setup(`const f=require('fs'),a=require('assert/strict');a.equal(f.readFileSync('/fixture/checkout/logs/legacy-dev.synthetic','utf8'),'retained');a.equal(f.statSync('/fixture/checkout/logs').uid,0);a.equal(f.statSync('/fixture/external/dev').uid,1000);a.equal(f.statSync('/fixture/external/dev').mode&0o777,0o750);`);
    const evidence = {run, syntheticOnly:true, controlledHttpNotApplicationReadiness:true,
      productionUnchanged:true, oldImage:fixedOldImage, restoredImage:restored.Image,
      devUid:1000, rotations:rotated.rotations, devMounts:inspect(names[2]).Mounts,
      productionMounts:after.Mounts, rollbackMounts:restored.Mounts,
      devLogMount:logMount(inspect(names[2])), productionLogMount:logMount(after), rollbackLogMount:logMount(restored)};
    if (process.env.DEV506_EVIDENCE) fs.writeFileSync(process.env.DEV506_EVIDENCE, JSON.stringify(evidence, null, 2));
    console.log('Synthetic rehearsal evidence run: ' + run);
  } catch (error) {
    if (process.env.DEV506_EVIDENCE) {
      const failed = names.map(name => {
        const result = docker(['inspect', '--format', '{{json .State}}', name], undefined, null);
        return {name, state:result.stdout.trim(), logs:docker(['logs', '--tail', '12', name], undefined, null).stderr};
      });
      fs.writeFileSync(process.env.DEV506_EVIDENCE + '.failure.json', JSON.stringify(failed, null, 2));
    }
    throw error;
  } finally {
    for (const name of names) remove(name);
    docker(['volume', 'rm', volume]);
  }
  assert.equal(docker(['ps', '-aq', '--filter', `label=${label}`]).stdout.trim(), '');
  assert.equal(docker(['volume', 'ls', '-q', '--filter', `label=${label}`]).stdout.trim(), '');
});
