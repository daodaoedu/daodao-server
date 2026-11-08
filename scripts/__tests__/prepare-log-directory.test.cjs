const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
test('actual container filesystem: dry-run, existing root/new selected leaf, idempotence and fail-closed existing metadata',()=>{
 const label=`io.daodao.test=506-init-${process.pid}-${Date.now()}`;
 const script=`const fs=require('node:fs'); const assert=require('node:assert/strict');
 const {prepare}=require('/scripts/prepare-log-directory.cjs');
 fs.mkdirSync('/fixture'); fs.mkdirSync('/fixture/checkout');
 const config={services:{dev_app:{volumes:[{type:'bind',source:'/fixture/external/dev',target:'/app/logs'}]},prod_app:{volumes:[{type:'bind',source:'/fixture/checkout/logs',target:'/app/logs'}]}}};
 const call=apply=>prepare(config,'/fixture/checkout','dev_app',apply);
 assert.throws(()=>call(false)); assert.throws(()=>call(true)); assert.equal(fs.existsSync('/fixture/external'),false);
 fs.mkdirSync('/fixture/external', {mode:0o755});
 assert.equal(call(false).action,'would-create'); assert.equal(fs.existsSync('/fixture/external/dev'),false);
 assert.equal(call(true).action,'created'); const s=fs.statSync('/fixture/external/dev');
 assert.equal(s.uid,1000); assert.equal(s.gid,1000); assert.equal(s.mode&511,488);
 assert.equal(fs.statSync('/fixture/external').uid,0);
 fs.writeFileSync('/fixture/external/dev/kept','unchanged');
 assert.equal(call(true).action,'unchanged'); assert.equal(fs.readFileSync('/fixture/external/dev/kept','utf8'),'unchanged');
 for (const mode of [0o2750, 0o4750]) {
 fs.chmodSync('/fixture/external/dev',mode); assert.throws(()=>call(false)); assert.throws(()=>call(true));
 assert.equal(fs.statSync('/fixture/external/dev').mode&0o7777,mode);
 }
 fs.chmodSync('/fixture/external/dev',511); assert.throws(()=>call(true));
 assert.equal(fs.statSync('/fixture/external/dev').mode&511,511);
 fs.chmodSync('/fixture/external/dev',488); fs.chownSync('/fixture/external',1000,1000); assert.throws(()=>call(true));
 fs.chownSync('/fixture/external',0,0); fs.chmodSync('/fixture/external',511); assert.throws(()=>call(true));
 fs.chmodSync('/fixture/external',0o755);
 for(const [service,leaf] of [['prod_app','prod'],['production_app','production']]) {
 const c={services:{[service]:{volumes:[{type:'bind',source:'/fixture/external/'+leaf,target:'/app/logs'}]}}};
 assert.equal(prepare(c,'/fixture/checkout',service).action,'would-create');
 assert.equal(fs.existsSync('/fixture/external/'+leaf),false);
 assert.equal(prepare(c,'/fixture/checkout',service,true).action,'created');
 const st=fs.statSync('/fixture/external/'+leaf); assert.equal(st.uid,1000); assert.equal(st.gid,1000); assert.equal(st.mode&0o7777,0o750);
 fs.chmodSync('/fixture/external/'+leaf,0o2750); assert.throws(()=>prepare(c,'/fixture/checkout',service,true));
 }
 fs.chmodSync('/fixture/external',0o1755); assert.throws(()=>call(true));
 console.log('actual filesystem init PASS');`;
 const result=spawnSync('docker',['run','--rm','-i','--label',label,'--network','none','--user','0:0','--mount',`type=bind,src=${path.resolve(__dirname,'..')},dst=/scripts,readonly`,'--entrypoint','node','daodao334-reviewed:local','-'],{input:script,encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr); assert.match(result.stdout,/actual filesystem init PASS/);
});
