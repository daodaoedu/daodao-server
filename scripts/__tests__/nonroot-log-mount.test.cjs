const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const image=process.env.NONROOT_TEST_IMAGE;
test('real UID1000 read-only preflight accepts prepared mount and denies unsafe logs', {skip:!image},()=>{
 const volume=`daodao334-preflight-${process.pid}-${Date.now()}`;
 function docker(args,input){return spawnSync('docker',args,{input,encoding:'utf8',timeout:30000});}
 function ok(result){assert.equal(result.status,0,result.stdout+result.stderr);}
 const source=fs.readFileSync(path.join(__dirname,'../preflight-container-logs.cjs'),'utf8');
 function setup(code){ok(docker(['run','--rm','--network','none','--user','0:0','--mount',`type=volume,src=${volume},dst=/app/logs`,'--entrypoint','node',image,'-e',code]));}
 function probe(env){return docker(['run','-i','--rm','--network','none','-e',`NODE_ENV=${env}`,'--mount',`type=volume,src=${volume},dst=/app/logs`,'--entrypoint','node',image,'-'],source);}
 ok(docker(['volume','create','--label','io.daodao.test=nonroot-334',volume]));
 try {
  setup('const f=require("fs");f.chownSync("/app/logs",1000,1000);f.chmodSync("/app/logs",0o750)');
  ok(probe('dev'));ok(probe('production'));
  setup('require("fs").writeFileSync("/app/logs/dev-error-existing.log","old",{mode:0o644})');
  assert.equal(probe('dev').status,1,'root-owned existing dev log must be rejected');
  ok(probe('prod'));
  setup('const f=require("fs");f.chownSync("/app/logs/dev-error-existing.log",1000,1000);f.writeFileSync("/app/logs/.hash-audit.json",JSON.stringify({files:[{name:"/app/logs/dev-error-existing.log"}]}),{mode:0o644})');
  assert.equal(probe('dev').status,1,'root-owned associated rotation metadata must be rejected');
  ok(probe('prod'));
  setup('require("fs").chownSync("/app/logs/.hash-audit.json",1000,1000)');
  ok(probe('dev'));
  setup('require("fs").writeFileSync("/app/logs/.empty-audit.json",JSON.stringify({files:[]}),{mode:0o644})');
  assert.equal(probe('dev').status,1,'unclassified empty root-owned audit must be rejected');
  setup('require("fs").chownSync("/app/logs/.empty-audit.json",1000,1000)');
  ok(probe('dev'));
  setup('require("fs").writeFileSync("/app/logs/.invalid-audit.json","invalid",{mode:0o644})');
  assert.equal(probe('dev').status,1,'invalid audit metadata must fail closed');
  setup('require("fs").unlinkSync("/app/logs/.invalid-audit.json")');
  setup('const f=require("fs");f.chownSync("/app/logs",0,0);f.chmodSync("/app/logs",0o755)');
  assert.equal(probe('dev').status,1,'unprepared mount must be rejected');
 } finally {ok(docker(['volume','rm',volume]));}
});
