const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

test('three simultaneous runtime log mounts isolate every environment and preserve legacy history',()=>{
 const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'506-production-binds-')));
 const run=`506-production-${process.pid}-${Date.now()}`,containers=[];
 const docker=args=>execFileSync('docker',args,{encoding:'utf8',timeout:30000}).trim();
 const services=['dev','prod','production'];const observed=[];
 try {
  for(const leaf of [...services,'legacy']){fs.mkdirSync(`${dir}/${leaf}`,{mode:0o777});fs.chmodSync(`${dir}/${leaf}`,0o777);}
  fs.writeFileSync(`${dir}/legacy/history.synthetic`,'retained');
  const original=fs.statSync(`${dir}/legacy/history.synthetic`);
  for(const env of services){
   const id=docker(['run','-d','--pull','never','--label',`io.daodao.test=${run}`,'--network','none','--read-only','--user','1000:1000','--mount',`type=bind,src=${dir}/${env},dst=/app/logs`,'--entrypoint','node','daodao334-reviewed:local','-e','setInterval(()=>{},1000)']);containers.push(id);
   docker(['exec',id,'node','-e',`const f=require('fs'),a=require('assert/strict');a.equal(process.getuid(),1000);const p='/app/logs/${env}.synthetic';f.writeFileSync(p,'${env}',{flag:'wx'});f.appendFileSync(p,'-append');f.renameSync(p,p+'.renamed');`]);
  }
  for(let i=0;i<services.length;i++){
   const result=JSON.parse(docker(['exec',containers[i],'node','-e',`const f=require('fs'),a=require('assert/strict'),names=${JSON.stringify(services)};for(const n of names){const p='/app/logs/'+n+'.synthetic.renamed';a.equal(f.existsSync(p),n===names[${i}]);if(n===names[${i}]){a.equal(f.readFileSync(p,'utf8'),n+'-append');a.equal(f.statSync(p).uid,1000);}}a.equal(f.existsSync('/app/logs/history.synthetic'),false);console.log(JSON.stringify({uid:process.getuid(),env:names[${i}],isolated:true}));`]));observed.push(result);
   const c=JSON.parse(docker(['inspect',containers[i]]))[0];assert.equal(c.Mounts.length,1);assert.equal(c.Mounts[0].Source,`${dir}/${services[i]}`);assert.equal(c.Mounts[0].Destination,'/app/logs');assert.equal(c.Config.Labels['io.daodao.test'],run);
  }
  assert.deepEqual(observed.map(x=>x.env),services);
  assert.equal(fs.readFileSync(`${dir}/legacy/history.synthetic`,'utf8'),'retained');
  const retained=fs.statSync(`${dir}/legacy/history.synthetic`);for(const k of ['uid','gid','mode','ino'])assert.equal(retained[k],original[k]);
 } finally {for(const id of containers)docker(['rm','-f',id]);fs.rmSync(dir,{recursive:true,force:true});}
});
