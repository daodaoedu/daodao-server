const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
for(const service of ['prod_app','production_app'])test(`${service}: direct Compose refuses missing source without creating it`,()=>{
 const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'506-missing-bind-')));
 const project=`missing506-${process.pid}-${service.replaceAll('_','-')}`;
 const cmd=args=>spawnSync('docker',args,{encoding:'utf8',timeout:30000,env:{...process.env,DOCKER_HUB_USERNAME:'fixture',DAODAO_LOG_ROOT:`${dir}/external`}});
 const fixture=path.join(dir,'fixture.json');
 try {
  fs.writeFileSync(`${dir}/.env.dev`,'');fs.writeFileSync(`${dir}/.env.prod`,'');fs.copyFileSync('docker-compose.yaml',`${dir}/candidate.yaml`);
  const rendered=cmd(['compose','-f',`${dir}/candidate.yaml`,'config','--format','json']);assert.equal(rendered.status,0,rendered.stderr);
  const mount=JSON.parse(rendered.stdout).services[service].volumes.find(v=>v.target==='/app/logs');
  assert.equal(fs.existsSync(mount.source),false);
  fs.writeFileSync(fixture,JSON.stringify({services:{app:{image:'daodao334-reviewed:local',network_mode:'none',read_only:true,entrypoint:'node',volumes:[mount]}}}));
  const result=cmd(['compose','-p',project,'-f',fixture,'run','--rm','--no-deps','-T','app','-e','process.exit(0)']);
  assert.notEqual(result.status,0,'missing source must fail even without preflight');
  assert.equal(fs.existsSync(mount.source),false,'Compose must not auto-create the host source');
  assert.match(result.stderr,/bind source path does not exist/i);
 } finally {if(fs.existsSync(fixture))cmd(['compose','-p',project,'-f',fixture,'down','--volumes','--remove-orphans']);fs.rmSync(dir,{recursive:true,force:true});}
});
