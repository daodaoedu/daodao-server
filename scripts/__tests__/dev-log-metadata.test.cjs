const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
test('preflight rejects unsafe leaf and parent metadata before file access probe',()=>{
 const script=`const fs=require('fs'),cp=require('child_process'),assert=require('assert');
 fs.mkdirSync('/fixture'); fs.mkdirSync('/fixture/bin'); fs.mkdirSync('/fixture/external'); fs.mkdirSync('/fixture/external/dev');
 fs.writeFileSync('/fixture/config',JSON.stringify({services:{dev_app:{volumes:[{type:'bind',source:'/fixture/external/dev',target:'/app/logs'}]}}}));
 fs.writeFileSync('/fixture/bin/docker',\`#!/bin/sh
printf '%s\\n' "$*" >> /fixture/calls
case "$*" in
 *'config --no-env-resolution --format json') cat /fixture/config;;
 *'config --images dev_app') echo candidate:test;;
 'run --rm -i '*) exec node /scripts/log-directory-guard.cjs /checkout dev_app --paths;;
 *'/metadata.cjs'*) exec node /scripts/log-directory-metadata.cjs /fixture/external/dev /fixture/external;;
 *'run --rm --no-deps '*) cat >/dev/null; exit 0;;
 *) exit 95;;
esac
\`,{mode:493});
 const run=()=>{fs.writeFileSync('/fixture/calls','');const r=cp.spawnSync('sh',['/scripts/preflight-container-logs.sh'],{cwd:'/checkout',env:{...process.env,PATH:'/fixture/bin:'+process.env.PATH,APP_ENV:'dev',APP_SERVICE:'dev_app'},encoding:'utf8'});return {...r,calls:fs.readFileSync('/fixture/calls','utf8')};};
 fs.mkdirSync('/checkout');
 for(const bad of ['leaf-owner','leaf-mode','parent-owner','parent-mode']) {
 fs.chownSync('/fixture/external/dev',1000,1000); fs.chmodSync('/fixture/external/dev',488); fs.chownSync('/fixture/external',0,0); fs.chmodSync('/fixture/external',493);
 if(bad==='leaf-owner')fs.chownSync('/fixture/external/dev',0,0);
 if(bad==='leaf-mode')fs.chmodSync('/fixture/external/dev',511);
 if(bad==='parent-owner')fs.chownSync('/fixture/external',1000,1000);
 if(bad==='parent-mode')fs.chmodSync('/fixture/external',511);
 const r=run();assert.notEqual(r.status,0,bad+' must reject');assert.doesNotMatch(r.calls,/--no-deps/,bad+' must reject before probe');
 }
 fs.chownSync('/fixture/external/dev',1000,1000);fs.chmodSync('/fixture/external/dev',488);fs.chownSync('/fixture/external',0,0);fs.chmodSync('/fixture/external',493);
 const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.calls,/--no-deps/);console.log('metadata gate PASS');`;
 const result=spawnSync('docker',['run','--rm','-i','--label',`io.daodao.test=506-metadata-${process.pid}-${Date.now()}`,'--network','none','--user','0:0','--mount',`type=bind,src=${path.resolve(__dirname,'..')},dst=/scripts,readonly`,'--entrypoint','node','daodao334-reviewed:local','-'],{input:script,encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/metadata gate PASS/);
});
