const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
test('deployment rejects unreadable log mounts before stopping old service',()=>{
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/continuous-delivery.yml'),'utf8');
 const gate=workflow.indexOf('sh scripts/preflight-container-logs.sh');
 assert.ok(gate>0,'missing preflight');
 assert.ok(gate<workflow.indexOf('xargs -r docker stop'),'preflight must precede stop');
});
test('TERM cancels smoke before further Docker operations',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nonroot-signal-'));
 try {
  fs.writeFileSync(path.join(dir,'docker'),`#!/bin/sh\necho "$*" >> "$CALLS"\ncase "$*" in\n 'run -d '*) kill -TERM "$PPID";;\n 'inspect --format {{.State.Running}} '*) echo false;;\n 'inspect --format {{.State.ExitCode}} '*) echo 0;;\n *must-fail*) exit 1;;\nesac\nexit 0\n`,{mode:0o755});
  const result=spawnSync('sh',['scripts/test-nonroot-container.sh','mock'],{cwd:root,env:{...process.env,PATH:dir+':'+process.env.PATH,CALLS:path.join(dir,'calls')},encoding:'utf8',timeout:5000});
  assert.equal(result.status,143);
  const calls=fs.readFileSync(path.join(dir,'calls'),'utf8');
  assert.ok(!calls.includes('\nexec '),'no fixture read after cancellation');
  assert.ok(!result.stdout.includes('PASS'),'no clean result after cancellation');
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('preflight forwards failure from exact service without lifecycle commands',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nonroot-preflight-'));
 try {
  fs.writeFileSync(path.join(dir,'docker'),'#!/bin/sh\nprintf "%s\\n" "$*" > "$CALLS"\ncat >/dev/null\nexit 42\n',{mode:0o755});
  const result=spawnSync('sh',['scripts/preflight-container-logs.sh'],{cwd:root,env:{...process.env,PATH:dir+':'+process.env.PATH,CALLS:path.join(dir,'calls'),APP_ENV:'dev',APP_SERVICE:'dev_app'},encoding:'utf8'});
  assert.equal(result.status,42);
  const call=fs.readFileSync(path.join(dir,'calls'),'utf8');
  assert.match(call,/compose --env-file .env.dev -f docker-compose.yaml run --rm --no-deps -T --user 1000:1000 --entrypoint node dev_app -/);
  assert.doesNotMatch(call,/\b(stop|rm -f|up)\b/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('production CD pair uses the shared prod env file',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nonroot-production-'));
 try {
  fs.writeFileSync(path.join(dir,'docker'),'#!/bin/sh\nprintf "%s\\n" "$*" > "$CALLS"\ncat >/dev/null\nexit 0\n',{mode:0o755});
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/continuous-delivery.yml'),'utf8');
  assert.match(workflow,/APP_ENV:.*dev.*dev.*prod/);
  const result=spawnSync('sh',['scripts/preflight-container-logs.sh'],{cwd:root,env:{...process.env,PATH:dir+':'+process.env.PATH,CALLS:path.join(dir,'calls'),APP_ENV:'prod',APP_SERVICE:'production_app'},encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.match(fs.readFileSync(path.join(dir,'calls'),'utf8'),/--env-file .env.prod .* production_app -/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
