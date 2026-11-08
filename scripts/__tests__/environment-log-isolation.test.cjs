const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
test('effective dev, prod and production mounts use distinct external leaves',()=>{
 const dir=fs.mkdtempSync('/tmp/daodao-506-compose-');
 try {
  for(const name of ['dev','prod']) fs.writeFileSync(`${dir}/.env.${name}`,'');
  fs.copyFileSync('docker-compose.yaml',`${dir}/docker-compose.yaml`);
  const c=JSON.parse(execFileSync('docker',['compose','-f',`${dir}/docker-compose.yaml`,'config','--format','json'],{env:{...process.env,DOCKER_HUB_USERNAME:'fixture'}}));
  const source=s=>c.services[s].volumes.find(v=>v.target==='/app/logs').source;
  assert.equal(source('dev_app'),'/var/log/daodao-server/dev');
  assert.equal(source('prod_app'),'/var/log/daodao-server/prod');
  assert.equal(source('production_app'),'/var/log/daodao-server/production');

 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('simultaneous owned bind containers cannot see new dev marker through legacy production mounts',()=>{
 const dir=fs.realpathSync(fs.mkdtempSync('/tmp/daodao-506-binds-'));
 const run=`506-bind-${process.pid}-${Date.now()}`;
 const containers=[];
 const docker=args=>execFileSync('docker',args,{encoding:'utf8'}).trim();
 try {
  for(const p of ['external/dev','checkout/logs','checkout/src']) fs.mkdirSync(`${dir}/${p}`,{recursive:true,mode:0o777});
  fs.chmodSync(`${dir}/external/dev`,0o777); fs.chmodSync(`${dir}/checkout/logs`,0o777);
  fs.writeFileSync(`${dir}/checkout/logs/old-dev-history`,'retained');
  for(const role of ['dev','production']) {
   const mounts=role==='dev' ? [`${dir}/external/dev:/app/logs`,`${dir}/checkout/src:/app/src`] : [`${dir}/checkout/logs:/app/logs`];
   const args=['run','-d','--label',`io.daodao.test=${run}`,'--network','none','--user','1000:1000'];
   for(const m of mounts) args.push('-v',m);
   args.push('--entrypoint','node','daodao334-reviewed:local','-e','setInterval(()=>{},1000)');
   containers.push(docker(args));
  }
  docker(['exec',containers[0],'node','-e',`require('fs').writeFileSync('/app/logs/new-dev-marker','dev')`]);
  docker(['exec',containers[1],'node','-e',`const fs=require('fs'),a=require('assert'); a.equal(fs.existsSync('/app/logs/new-dev-marker'),false); a.equal(fs.readFileSync('/app/logs/old-dev-history','utf8'),'retained'); fs.writeFileSync('/app/logs/prod-marker','production');`]);
  docker(['exec',containers[0],'node','-e',`require('assert').equal(require('fs').existsSync('/app/logs/prod-marker'),false)`]);
  for(const id of containers) {
   const inspected=JSON.parse(docker(['inspect',id]))[0];
   assert.equal(inspected.Config.Labels['io.daodao.test'],run);
   for(const m of inspected.Mounts) if(m.Destination!=='/app/logs') assert.ok(!fs.existsSync(`${m.Source}/new-dev-marker`));
  }
  assert.equal(fs.readFileSync(`${dir}/checkout/logs/old-dev-history`,'utf8'),'retained');
 } finally {
  for(const id of containers) docker(['rm','-f',id]);
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
