const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const base = 'vincentxxx/app@sha256:9f4e7c959e44be88340737494238e0cecab2b60fc56e2f646ee6e64d8b8647d8';

test('immutable production derivative preserves artifacts and permits only runtime writes', {
  timeout: 900000,
}, () => {
  const id = `daodao-production-hardening-${process.pid}-${Date.now()}`;
  const label = `io.daodao.production-hardening=${id}`;
  const image = `${id}:test`;
  const evidence = path.resolve(root, '../evidence/minimal-production-image');
  const volume = `${id}-bind-source`;
  fs.mkdirSync(evidence, {recursive: true});
  const log = [];
  function docker(args, input) {
    const result = spawnSync('docker', args, {input, encoding: 'utf8', timeout: 600000, maxBuffer: 32 * 1024 * 1024});
    log.push({args, status: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message});
    return result;
  }
  function ok(result) { assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`); return result.stdout; }
  function run(target, code, options = []) {
    return docker(['run', '--platform', 'linux/amd64', '--rm', '-i', '--network', 'none', '--label', label, ...options, '--entrypoint', 'node', target, '-'], code);
  }
  const manifest = `const f=require('fs'),p=require('path'),c=require('crypto');const out=[];
function walk(x){const s=f.lstatSync(x);if(s.isSymbolicLink())out.push([x,'link',f.readlinkSync(x),s.mode&0o7777,s.uid,s.gid]);else if(s.isDirectory()){out.push([x,'directory',s.mode&0o7777,s.uid,s.gid]);for(const n of f.readdirSync(x).sort())walk(p.join(x,n));}else if(s.isFile())out.push([x,'sha256',c.createHash('sha256').update(f.readFileSync(x)).digest('hex'),s.mode&0o7777,s.uid,s.gid]);}
for(const x of ['/app/dist','/app/generated','/app/node_modules','/app/public','/app/prisma','/app/package.json','/app/pnpm-lock.yaml','/app/ecosystem.config.js','/app/openapi.json','/app/openapi.yaml'])if(f.existsSync(x))walk(x);console.log(JSON.stringify(out));`;
  try {
    // Inspect first: an absent immutable base fails instead of pulling a mutable tag.
    const original = JSON.parse(ok(docker(['image', 'inspect', base])))[0];
    assert.equal(original.Id, 'sha256:a2f913ba07668f19b1db7bc55457b1ef6b26951b88fd06598e539197db9f376f');
    assert.equal(original.Architecture, 'amd64');
    ok(docker(['build', '--platform', 'linux/amd64', '--network', 'none', '--pull=false', '--label', label, '-f', 'Dockerfile.production-hardening', '-t', image, '.']));
    const derived = JSON.parse(ok(docker(['image', 'inspect', image])))[0];
    for (const key of ['Entrypoint', 'Cmd', 'WorkingDir', 'Healthcheck', 'ExposedPorts']) assert.deepEqual(derived.Config[key], original.Config[key], key);
    assert.equal(derived.Config.User, 'node');
    assert.deepEqual(derived.RootFS.Layers.slice(0, original.RootFS.Layers.length), original.RootFS.Layers, 'all original filesystem layers must be inherited');
    assert.deepEqual(derived.Config.Env.filter(value => !value.startsWith('PM2_HOME=')), original.Config.Env.filter(value => !value.startsWith('PM2_HOME=')), 'all other inherited environment values');
    const before = ok(run(base, manifest));
    const after = ok(run(image, manifest));
    assert.equal(after, before, 'deployed application artifact hashes must remain identical');
    assert.ok(JSON.parse(before).some(([name]) => name.startsWith('/app/dist/')), 'manifest must contain built application');
    fs.writeFileSync(path.join(evidence, 'artifact-manifest.json'), before);
    ok(run(image, `const f=require('fs'),a=require('assert/strict');a.equal(process.getuid(),1000);a.equal(process.getgid(),1000);a.equal(process.env.PM2_HOME,'/home/node/.pm2');for(const d of [process.env.PM2_HOME,'/app/logs','/tmp']){const p=d+'/hardening-probe';f.writeFileSync(p,'ok');f.unlinkSync(p);}for(const p of ['/app','/app/dist','/app/generated','/app/node_modules','/app/public','/app/prisma','/app/package.json','/app/ecosystem.config.js']){if(f.existsSync(p))a.throws(()=>f.accessSync(p,f.constants.W_OK),p+' must not be writable');}console.log('UID/GID 1000; runtime writes PASS; program write denial PASS');`));
    // A Docker-managed Linux fixture avoids macOS file-sharing ownership emulation.
    ok(docker(['volume', 'create', '--label', label, volume]));
    const bind = JSON.parse(ok(docker(['volume', 'inspect', volume])))[0].Mountpoint;
    const mount = ['--mount', `type=bind,src=${bind},dst=/app/logs`];
    const probe = fs.readFileSync(path.join(root, 'scripts/preflight-container-logs.cjs'), 'utf8');
    ok(run(image, `const f=require('fs');f.chownSync('/app/logs',0,0);f.chmodSync('/app/logs',0o755);`, ['--user', '0:0', ...mount]));
    const rejected = run(image, probe, ['-e', 'NODE_ENV=production', ...mount]);
    assert.equal(rejected.status, 1, 'root-owned bind must be rejected');
    assert.match(rejected.stderr, /Log permission preflight FAILED/);
    ok(run(image, `const f=require('fs');f.chownSync('/app/logs',1000,1000);f.chmodSync('/app/logs',0o750);`, ['--user', '0:0', ...mount]));
    ok(run(image, probe, ['-e', 'NODE_ENV=production', ...mount]));
    fs.writeFileSync(path.join(evidence, 'image-inspect.json'), JSON.stringify({base: original, derived}, null, 2));
  } finally {
    // Every resource is uniquely named and labeled. Never prune shared Docker state.
    try {
      const containers = ok(docker(['ps', '-aq', '--filter', `label=${label}`])).trim().split(/\s+/).filter(Boolean);
      if (containers.length) ok(docker(['rm', '-f', '-v', ...containers]));
      const candidate = docker(['image', 'inspect', image]);
      if (candidate.status === 0) ok(docker(['image', 'rm', image]));
      else assert.match(candidate.stderr, /No such image|No such object/i);
      const ownedVolume = docker(['volume', 'inspect', volume]);
      if (ownedVolume.status === 0) ok(docker(['volume', 'rm', volume]));
      else assert.match(ownedVolume.stderr, /No such volume|No such object/i);
      for (const args of [['ps', '-aq'], ['volume', 'ls', '-q'], ['image', 'ls', '-q']]) {
        assert.equal(ok(docker([...args, '--filter', `label=${label}`])).trim(), '', 'owned resources must be removed');
      }
    } finally {
      fs.writeFileSync(path.join(evidence, 'test-run.json'), JSON.stringify(log, null, 2));
    }
  }
});
