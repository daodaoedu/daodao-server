const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
test('preflight rejects missing/symlink sources before probe, preserves exact UID probe and failures',()=>{
 const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'daodao-506-preflight-')));
 try {
  fs.writeFileSync(`${dir}/docker`,`#!/bin/sh
printf '%s\\n' "$*" >> "$CALLS"
case "$*" in
 *'config --no-env-resolution --format json') cat "$CONFIG";;
 *'config --images dev_app') echo candidate:test;;
 'run --rm -i '*) [ -z \"$GUARD_EMPTY\" ] || exit 0; exec "$NODE" "$GUARD" "$CHECKOUT" dev_app --paths;;
 *'/metadata.cjs'*) exit 0;;
 *'run --rm --no-deps '*) cat >/dev/null; exit "$PROBE_EXIT";;
 *) exit 95;;
esac
`,{mode:0o755});
  const env={...process.env,PATH:`${dir}:${process.env.PATH}`,CALLS:`${dir}/calls`,CONFIG:`${dir}/config`,NODE:process.execPath,GUARD:`${root}/scripts/log-directory-guard.cjs`,CHECKOUT:root,APP_ENV:'dev',APP_SERVICE:'dev_app',PROBE_EXIT:'0'};
  const run=source=>{
   fs.writeFileSync(env.CALLS,'');
   fs.writeFileSync(env.CONFIG,JSON.stringify({services:{dev_app:{volumes:[{type:'bind',source,target:'/app/logs'}]}}}));
   const result=spawnSync('sh',['scripts/preflight-container-logs.sh'],{cwd:root,env,encoding:'utf8'});
   return {...result,calls:fs.readFileSync(env.CALLS,'utf8')};
  };
  let r=run(`${dir}/dev`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/);
  fs.mkdirSync(`${dir}/dev`); r=run(`${dir}/dev`); assert.equal(r.status,0,r.stderr); assert.match(r.calls,/--no-deps -T --user 1000:1000 --entrypoint node dev_app -/);
  env.GUARD_EMPTY='yes'; r=run(`${dir}/dev`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/); delete env.GUARD_EMPTY;
  env.PROBE_EXIT='42'; r=run(`${dir}/dev`); assert.equal(r.status,42);
  fs.symlinkSync(dir,`${dir}/alias`); r=run(`${dir}/alias/dev`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/);
  r=run(`${root}/dev`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
for (const signal of ['INT','TERM']) test(`preflight ${signal} stops before probe`,()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'daodao-506-signal-'));
 try {
  fs.writeFileSync(`${dir}/docker`,`#!/bin/sh
printf '%s\\n' "$*" >> "$CALLS"
kill -${signal} "$PPID"
exit 0
`,{mode:0o755});
  const result=spawnSync('sh',['scripts/preflight-container-logs.sh'],{cwd:root,env:{...process.env,PATH:`${dir}:${process.env.PATH}`,CALLS:`${dir}/calls`,APP_ENV:'dev',APP_SERVICE:'dev_app'},encoding:'utf8'});
  assert.equal(result.status,signal==='INT'?130:143,result.stderr);
  assert.doesNotMatch(fs.readFileSync(`${dir}/calls`,'utf8'),/--no-deps/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
