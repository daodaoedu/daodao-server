const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
for (const [service,leaf,appEnv] of [['dev_app','dev','dev'],['prod_app','prod','prod'],['production_app','production','prod']]) test(`${service}: preflight rejects missing/symlink sources before probe, preserves exact UID probe and failures`,()=>{
 const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'daodao-506-preflight-')));
 try {
  fs.writeFileSync(`${dir}/docker`,`#!/bin/sh
printf '%s\\n' "$*" >> "$CALLS"
case "$*" in
 *'config --no-env-resolution --format json') cat "$CONFIG";;
 *'config --images dev_app') printf 'redis:6\\ncandidate:test\\n';;
 'run --rm -i '*) [ -z \"$GUARD_EMPTY\" ] || exit 0; exec "$NODE" "$GUARD" "$CHECKOUT" "$APP_SERVICE" --paths;;
 *'/metadata.cjs'*) exit "$METADATA_EXIT";;
 *'run --rm --no-deps '*) cat >/dev/null; exit "$PROBE_EXIT";;
 *) exit 95;;
esac
`,{mode:0o755});
  const env={...process.env,PATH:`${dir}:${process.env.PATH}`,CALLS:`${dir}/calls`,CONFIG:`${dir}/config`,NODE:process.execPath,GUARD:`${root}/scripts/log-directory-guard.cjs`,CHECKOUT:root,APP_ENV:appEnv,APP_SERVICE:service,PROBE_EXIT:'0',METADATA_EXIT:'0'};
  const run=(source,image='candidate:test')=>{
   fs.writeFileSync(env.CALLS,'');
   fs.writeFileSync(env.CONFIG,JSON.stringify({services:{[service]:{image,volumes:[{type:'bind',source,target:'/app/logs'}]}}}));
   const result=spawnSync('sh',['scripts/preflight-container-logs.sh'],{cwd:root,env,encoding:'utf8'});
   return {...result,calls:fs.readFileSync(env.CALLS,'utf8')};
  };
  let r=run(`${dir}/${leaf}`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/);
  fs.mkdirSync(`${dir}/${leaf}`); r=run(`${dir}/${leaf}`); assert.equal(r.status,0,r.stderr); assert.doesNotMatch(r.calls,/config --images/); assert.match(r.calls,/--entrypoint node candidate:test \/guard.cjs/); assert.ok(r.calls.includes(`--no-deps -T --user 1000:1000 --entrypoint node ${service} -`));
  for (const image of [undefined,'','redis:6\ncandidate:test',42,'-invalid']) { r=run(`${dir}/${leaf}`,image===undefined?null:image); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/run --rm/); }
  env.GUARD_EMPTY='yes'; r=run(`${dir}/${leaf}`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/); delete env.GUARD_EMPTY;
  env.METADATA_EXIT='41'; r=run(`${dir}/${leaf}`); assert.equal(r.status,41); assert.doesNotMatch(r.calls,/--no-deps/); env.METADATA_EXIT='0';
  env.PROBE_EXIT='42'; r=run(`${dir}/${leaf}`); assert.equal(r.status,42);
  fs.symlinkSync(dir,`${dir}/alias`); r=run(`${dir}/alias/${leaf}`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/);
  r=run(`${root}/${leaf}`); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/--no-deps/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
for (const [appEnv,service] of [['dev','dev_app'],['prod','prod_app'],['prod','production_app']]) for (const signal of ['INT','TERM']) test(`${service}: preflight ${signal} stops before probe`,()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'daodao-506-signal-'));
 try {
  fs.writeFileSync(`${dir}/docker`,`#!/bin/sh
printf '%s\\n' "$*" >> "$CALLS"
kill -${signal} "$PPID"
exit 0
`,{mode:0o755});
  const result=spawnSync('sh',['scripts/preflight-container-logs.sh'],{cwd:root,env:{...process.env,PATH:`${dir}:${process.env.PATH}`,CALLS:`${dir}/calls`,APP_ENV:appEnv,APP_SERVICE:service},encoding:'utf8'});
  assert.equal(result.status,signal==='INT'?130:143,result.stderr);
  assert.doesNotMatch(fs.readFileSync(`${dir}/calls`,'utf8'),/--no-deps/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
for (const [service,leaf,appEnv] of [['dev_app','dev','dev'],['prod_app','prod','prod'],['production_app','production','prod']]) test(`${service}: real Compose dependency images do not become the Docker run image`,()=>{
 const probe=spawnSync('sh',['-c','command -v docker'],{encoding:'utf8'});
 assert.equal(probe.status,0,'Docker CLI is required for the Compose regression');
 const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'compose-image-')));
 try {
  fs.mkdirSync(`${dir}/checkout`); fs.mkdirSync(`${dir}/external`); fs.mkdirSync(`${dir}/external/${leaf}`);
  fs.writeFileSync(`${dir}/checkout/.env.${appEnv}`,'');
  fs.writeFileSync(`${dir}/checkout/docker-compose.yaml`,JSON.stringify({services:{[service]:{image:'candidate:test',depends_on:['redis_dev'],volumes:[{type:'bind',source:`${dir}/external/${leaf}`,target:'/app/logs'}]},redis_dev:{image:'redis:6'}}}));
  fs.writeFileSync(`${dir}/docker`,`#!/bin/sh
printf '%s\\n' "$*" >> "$CALLS"
case "$*" in
 compose*config*) exec "$REAL_DOCKER" "$@";;
 'run --rm -i '*) exec "$NODE" "$GUARD" "$CHECKOUT" "$APP_SERVICE" --paths;;
 *'/metadata.cjs'*) exit 0;;
 *'run --rm --no-deps '*) cat >/dev/null; exit 0;;
 *) exit 95;;
esac
`,{mode:0o755});
  const env={...process.env,PATH:`${dir}:${process.env.PATH}`,REAL_DOCKER:probe.stdout.trim(),CALLS:`${dir}/calls`,NODE:process.execPath,GUARD:`${root}/scripts/log-directory-guard.cjs`,CHECKOUT:`${dir}/checkout`,APP_ENV:appEnv,APP_SERVICE:service};
  const listed=spawnSync(env.REAL_DOCKER,['compose','--env-file',`.env.${appEnv}`,'config','--images',service],{cwd:env.CHECKOUT,env,encoding:'utf8'});
  assert.equal(listed.status,0,listed.stderr); assert.deepEqual(new Set(listed.stdout.trim().split('\n')),new Set(['candidate:test','redis:6']));
  const result=spawnSync('sh',[`${root}/scripts/preflight-container-logs.sh`],{cwd:env.CHECKOUT,env,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const calls=fs.readFileSync(env.CALLS,'utf8');
  assert.match(calls,/--entrypoint node candidate:test \/guard.cjs/);
  assert.doesNotMatch(calls,/--entrypoint node redis:6/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
