const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
for(const [service,leaf,appEnv] of [['dev_app','dev','dev'],['prod_app','prod','prod'],['production_app','production','prod']]) test(`${service}: preflight rejects unsafe leaf and parent metadata before file access probe`,()=>{
 const script=`const fs=require('fs'),cp=require('child_process'),assert=require('assert');
 fs.mkdirSync('/fixture'); fs.mkdirSync('/fixture/bin'); fs.mkdirSync('/fixture/external'); fs.mkdirSync('/fixture/external/dev');
 fs.writeFileSync('/fixture/config',JSON.stringify({services:{dev_app:{image:'candidate:test',volumes:[{type:'bind',source:'/fixture/external/dev',target:'/app/logs'}]}}}));
 fs.writeFileSync('/fixture/bin/python3', '#!/bin/sh\\necho candidate:test\\n', {mode:493});
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
 for(const bad of ['leaf-owner','leaf-group','leaf-mode','parent-owner','parent-mode','leaf-setgid','leaf-setuid','leaf-sticky','parent-setgid','parent-setuid','parent-sticky']) {
 fs.chownSync('/fixture/external/dev',1000,1000); fs.chmodSync('/fixture/external/dev',488); fs.chownSync('/fixture/external',0,0); fs.chmodSync('/fixture/external',493);
 if(bad==='leaf-owner')fs.chownSync('/fixture/external/dev',0,0);
 if(bad==='leaf-group')fs.chownSync('/fixture/external/dev',1000,0);
 if(bad==='leaf-mode')fs.chmodSync('/fixture/external/dev',511);
 if(bad==='parent-owner')fs.chownSync('/fixture/external',1000,1000);
 if(bad==='parent-mode')fs.chmodSync('/fixture/external',511);
 if(bad==='leaf-setgid')fs.chmodSync('/fixture/external/dev',0o2750);
 if(bad==='leaf-setuid')fs.chmodSync('/fixture/external/dev',0o4750);
 if(bad==='leaf-sticky')fs.chmodSync('/fixture/external/dev',0o1750);
 if(bad==='parent-setgid')fs.chmodSync('/fixture/external',0o2755);
 if(bad==='parent-setuid')fs.chmodSync('/fixture/external',0o4755);
 if(bad==='parent-sticky')fs.chmodSync('/fixture/external',0o1755);
 const r=run();assert.notEqual(r.status,0,bad+' must reject');assert.doesNotMatch(r.calls,/--no-deps/,bad+' must reject before probe');
 }
 fs.chownSync('/fixture/external/dev',1000,1000);fs.chmodSync('/fixture/external/dev',488);fs.chownSync('/fixture/external',0,0);fs.chmodSync('/fixture/external',493);
 const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.calls,/--no-deps/);console.log('metadata gate PASS');`.replaceAll('dev_app',service).replaceAll('/external/dev','/external/'+leaf).replace("APP_ENV:'dev'","APP_ENV:'"+appEnv+"'");
 const result=spawnSync('docker',['run','--rm','-i','--label',`io.daodao.test=506-metadata-${process.pid}-${Date.now()}`,'--network','none','--user','0:0','--mount',`type=bind,src=${path.resolve(__dirname,'..')},dst=/scripts,readonly`,'--entrypoint','node','daodao334-reviewed:local','-'],{input:script,encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/metadata gate PASS/);
});
