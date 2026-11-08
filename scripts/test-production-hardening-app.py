import subprocess,json,time,uuid,os,sys,traceback
from pathlib import Path
repo=Path(__file__).resolve().parents[1]
if os.environ.get('PRODUCTION_HARDENING_APP_TEST')!='1':
 raise SystemExit('Opt in with PRODUCTION_HARDENING_APP_TEST=1; uses only local disposable Docker fixtures')
if not os.environ.get('PRODUCTION_HARDENING_EVIDENCE_DIR'):
 raise SystemExit('PRODUCTION_HARDENING_EVIDENCE_DIR must name an external evidence directory')
evidence=Path(os.environ['PRODUCTION_HARDENING_EVIDENCE_DIR']).resolve()
if evidence==repo or repo in evidence.parents:raise SystemExit('Evidence must be outside the source repository')
evidence.mkdir(parents=True,exist_ok=True)
base='vincentxxx/app@sha256:9f4e7c959e44be88340737494238e0cecab2b60fc56e2f646ee6e64d8b8647d8'
runid='minimal506-'+uuid.uuid4().hex[:12];network=runid+'-net';pg=runid+'-pg';redis=runid+'-redis';app=runid+'-app';volume=runid+'-logs';candidate='daodao506-hardening:'+runid;label='io.daodao.hardening-app='+runid
containers=[];network_created=False;volume_created=False;image_created=False

def run(args,input=None,timeout=90,check=True,env=None):
 p=subprocess.run(args,input=input,text=True,capture_output=True,timeout=timeout,env=env)
 if check and p.returncode:raise RuntimeError('Command failed: '+args[0]+' '+args[1]+'\n'+p.stderr[-2000:])
 return p

def docker(args,**kw):return run(['docker',*args],**kw)
def inspect(name):return json.loads(docker(['inspect',name]).stdout)[0]
result={'run':runid,'base':base,'local_only':True,'business_artifact_not_rebuilt':True,'app_config_test_override':'one PM2 worker; original image config and CMD preserved','resources_cleaned':False}
try:
 docker(['build','--platform','linux/amd64','--network','none','--label',label,'-f','Dockerfile.production-hardening','-t',candidate,'.'],timeout=180);image_created=True
 print('image built',flush=True)
 source=docker(['run','--rm','--pull','never','--platform','linux/amd64','--network','none','--entrypoint','node',base,'-e',"const f=require('fs'),s=f.readFileSync('/app/generated/prisma/schema.prisma','utf8');if(!/url\\s*=\\s*env\\(\"DATABASE_URL\"\\)/.test(s))process.exit(2);process.stdout.write(s)"]).stdout
 schema=evidence/'fixture-schema.prisma';schema.write_text(source)
 env={k:v for k,v in os.environ.items()if k in ['PATH','HOME','TMPDIR','PNPM_HOME']};env.update(DATABASE_URL='postgresql://fixture:synthetic-only@pg:5432/fixture',PRISMA_HIDE_UPDATE_MESSAGE='1',CHECKPOINT_DISABLE='1')
 ddl=run(['pnpm','exec','prisma','migrate','diff','--from-empty','--to-schema-datamodel',str(schema),'--script'],timeout=90,env=env);(evidence/'fixture-ddl.sql').write_text(ddl.stdout)
 docker(['network','create','--internal','--label',label,network]);network_created=True
 docker(['volume','create','--label',label,volume]);volume_created=True
 docker(['run','-d','--name',pg,'--label',label,'--pull','never','--network',network,'--network-alias','pg','--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_USER=fixture','-e','POSTGRES_PASSWORD=synthetic-only','-e','POSTGRES_DB=fixture','postgres:14']);containers.append(pg)
 docker(['run','-d','--name',redis,'--label',label,'--pull','never','--network',network,'--network-alias','redis','redis:6.0-alpine','redis-server','--save','','--appendonly','no']);containers.append(redis)
 for _ in range(45):
  if docker(['exec',pg,'pg_isready','-U','fixture','-d','fixture'],check=False).returncode==0:break
  time.sleep(1)
 else:raise RuntimeError('Synthetic database did not become ready')
 docker(['exec',pg,'psql','-X','-U','fixture','-d','fixture','-v','ON_ERROR_STOP=1','-c','CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS citext;'])
 applied=docker(['exec','-i',pg,'psql','-X','-q','-U','fixture','-d','fixture','-v','ON_ERROR_STOP=1'],input=ddl.stdout);(evidence/'fixture-ddl-apply.txt').write_text(applied.stdout+applied.stderr)
 print('synthetic schema ready',flush=True)
 prepare="const fs=require('fs'),{prepare}=require('/checks/prepare-log-directory.cjs');console.log(JSON.stringify(prepare({services:{production_app:{volumes:[{type:'bind',source:'/fixture/production',target:'/app/logs'}]}}},'/checkout','production_app',true)));"
 docker(['run','--rm','--pull','never','--platform','linux/amd64','--network','none','--user','0:0','--mount','type=volume,src='+volume+',dst=/fixture','--mount','type=bind,src='+str(repo/'scripts')+',dst=/checks,readonly','--entrypoint','node',base,'-e',prepare])
 mountpoint=docker(['volume','inspect','--format','{{.Mountpoint}}',volume]).stdout.strip()+'/production'
 pm2=evidence/'fixture-ecosystem.cjs';pm2.write_text("module.exports={apps:[{name:'node_app',script:'dist/src/server.js',instances:1,exec_mode:'cluster',out_file:'/dev/null',error_file:'/dev/null',log_file:'/dev/null',merge_logs:false,max_memory_restart:'1G',max_restarts:3,min_uptime:'10s',restart_delay:4000,env:{NODE_ENV:'prod'}}]};")
 args=['run','-d','--pull','never','--platform','linux/amd64','--name',app,'--label',label,'--network',network,'--mount','type=bind,src='+mountpoint+',dst=/app/logs','--mount','type=bind,src='+str(pm2)+',dst=/app/ecosystem.config.js,readonly']
 values={'NODE_ENV':'prod','DATABASE_URL':'postgresql://fixture:synthetic-only@pg:5432/fixture','REDIS_HOST':'redis','REDIS_PORT':'6379','SESSION_SECRET':'synthetic-local-only-session-key-506-32','JWT_SECRET':'synthetic-local-only-jwt-key-506','EMAIL_ADDRESS':'fixture@example.invalid','EMAIL_PASSWORD':'synthetic-only','FRONTEND_URL':'http://fixture.invalid','BACKEND_URL':'http://fixture.invalid'}
 for k,v in values.items():args+=['-e',k+'='+v]
 args.append(candidate);docker(args);containers.append(app)
 http="fetch('http://127.0.0.1:3000'+process.argv[1]).then(r=>console.log(JSON.stringify({status:r.status}))).catch(()=>process.exit(1))"
 for _ in range(90):
  p=docker(['exec',app,'node','-e',http,'/api/v1/health'],check=False)
  if p.returncode==0 and json.loads(p.stdout)['status']==200:break
  if not inspect(app)['State']['Running']:raise RuntimeError('Synthetic app exited')
  time.sleep(1)
 else:raise RuntimeError('Synthetic app did not become ready')
 marker='minimal-hardening-'+uuid.uuid4().hex
 response=json.loads(docker(['exec',app,'node','-e',http,'/api/v1/'+marker]).stdout);assert response['status']==404
 time.sleep(3)
 probe="const fs=require('fs'),a=require('assert/strict');a.equal(process.getuid(),1000);a.equal(process.getgid(),1000);const files=fs.readdirSync('/app/logs').filter(n=>n.startsWith('prod-')&&n.endsWith('.log'));a.ok(files.some(n=>fs.readFileSync('/app/logs/'+n,'utf8').includes(process.argv[1])));console.log(JSON.stringify({uid:process.getuid(),gid:process.getgid(),own_request_marker:true,files}));"
 result['app_probe']=json.loads(docker(['exec',app,'node','-e',probe,marker]).stdout)
 pm2probe="const cp=require('child_process'),out=cp.execFileSync('/app/node_modules/.bin/pm2',['jlist'],{encoding:'utf8'});console.log(JSON.stringify(JSON.parse(out).map(p=>({status:p.pm2_env.status,restarts:p.pm2_env.restart_time}))));"
 result['pm2']=json.loads(docker(['exec',app,'node','-e',pm2probe]).stdout);assert result['pm2'] and all(p['status']=='online' and p['restarts']==0 for p in result['pm2'])
 result['docs_status']={uri:json.loads(docker(['exec',app,'node','-e',http,uri]).stdout)['status']for uri in ['/api-docs/','/api/docs/']}
 result.update(health_status=200,negative_status=404,actual_pm2_command=True,synthetic_schema_from_actual_generated_client=True,no_real_credentials=True,no_external_network=True)
 print('actual app smoke passed',flush=True)
 # Abort-before-stop: a root-owned legacy bind must fail while the healthy candidate stays running.
 legacy_prepare="const f=require('fs');f.mkdirSync('/fixture/legacy',{mode:0o755});f.writeFileSync('/fixture/legacy/retained.synthetic','retained');"
 docker(['run','--rm','--pull','never','--platform','linux/amd64','--network','none','--user','0:0','--mount','type=volume,src='+volume+',dst=/fixture','--entrypoint','node',base,'-e',legacy_prepare])
 legacy_source=mountpoint.rsplit('/',1)[0]+'/legacy'
 probe_source=(repo/'scripts/preflight-container-logs.cjs').read_text()
 denied=docker(['run','--rm','-i','--pull','never','--platform','linux/amd64','--network','none','--user','1000:1000','--env','NODE_ENV=prod','--mount','type=bind,src='+legacy_source+',dst=/app/logs','--entrypoint','node',candidate,'-'],input=probe_source,check=False)
 assert denied.returncode==1 and 'Log permission preflight FAILED' in denied.stderr,'Expected permission denial, not a Docker error'
 assert inspect(app)['State']['Running']
 assert json.loads(docker(['exec',app,'node','-e',http,'/api/v1/health']).stdout)['status']==200
 result['unsafe_bind_denied_before_stop']=True
 # Rehearse exact old image/runtime restoration only within this owned fixture.
 docker(['rm','-f','-v',app]);containers.remove(app)
 oldapp=runid+'-old';badapp=runid+'-bad'
 oldargs=['run','-d','--pull','never','--platform','linux/amd64','--name',oldapp,'--label',label,'--network',network,'--mount','type=bind,src='+legacy_source+',dst=/app/logs','--mount','type=bind,src='+str(pm2)+',dst=/app/ecosystem.config.js,readonly']
 for k,v in values.items():oldargs+=['-e',k+'='+v]
 oldargs.append(base);docker(oldargs);containers.append(oldapp)
 def wait_old():
  for _ in range(75):
   status=docker(['exec',oldapp,'node','-e',http,'/api/v1/health'],check=False)
   if status.returncode==0 and json.loads(status.stdout)['status']==200:return
   time.sleep(1)
  raise RuntimeError('Old fixture app failed readiness')
 wait_old();original=inspect(oldapp);assert original['Config']['User']in['','root','0','0:0'],'Unexpected baseline Config.User'
 fixed_old=original['Image'];docker(['rm','-f','-v',oldapp]);containers.remove(oldapp)
 docker(['run','-d','--pull','never','--platform','linux/amd64','--name',badapp,'--label',label,'--network','none','--mount','type=bind,src='+mountpoint+',dst=/app/logs','--entrypoint','node',candidate,'-e','process.exit(41)']);containers.append(badapp)
 for _ in range(20):
  state=inspect(badapp)['State']
  if not state['Running']:break
  time.sleep(.2)
 assert not state['Running'] and state['ExitCode']==41,'Controlled failure state: '+json.dumps(state)
 docker(['rm','-f','-v',badapp]);containers.remove(badapp)
 oldargs[-1]=fixed_old;docker(oldargs);containers.append(oldapp);wait_old();restored=inspect(oldapp)
 assert restored['Image']==fixed_old,'Rollback image drift'
 for k in ['User','Entrypoint','Cmd','WorkingDir']:assert restored['Config'][k]==original['Config'][k],'Rollback config drift: '+k
 old_env=dict(v.split('=',1)for v in original['Config']['Env']);new_env=dict(v.split('=',1)for v in restored['Config']['Env'])
 assert len(old_env)==len(original['Config']['Env']) and len(new_env)==len(restored['Config']['Env']),'Duplicate environment variables'
 result['rollback_env_comparison']={'raw_order_equal':original['Config']['Env']==restored['Config']['Env'],'effective_map_equal':old_env==new_env,'changed_keys':[k for k in old_env.keys()|new_env.keys()if old_env.get(k)!=new_env.get(k)]}
 assert old_env==new_env,'Rollback environment values differ: '+','.join(result['rollback_env_comparison']['changed_keys'])
 assert sorted(restored['Mounts'],key=lambda m:m['Destination'])==sorted(original['Mounts'],key=lambda m:m['Destination']),'Rollback mount drift'
 old_probe="const f=require('fs'),a=require('assert/strict');a.equal(process.getuid(),0);a.equal(f.readFileSync('/app/logs/retained.synthetic','utf8'),'retained');console.log(JSON.stringify({uid:process.getuid(),history_preserved:true}));"
 for uri,status in result['docs_status'].items():assert json.loads(docker(['exec',oldapp,'node','-e',http,uri]).stdout)['status']==status,'Documentation route changed under nonroot'
 result['rollback_probe']=json.loads(docker(['exec',oldapp,'node','-e',old_probe]).stdout)
 result.update(controlled_startup_failure_exit=41,fixed_old_image_restored=True,old_runtime_config_and_mount_restored=True,old_actual_app_health=200)
 print('fixed old image/runtime rollback passed',flush=True)
except Exception as e:
 result['failure']=repr(e);result['traceback']=traceback.format_exc()
 if app in containers:
  log=docker(['logs','--tail','120',app],check=False);(evidence/'synthetic-app-failure.log').write_text(log.stdout+log.stderr)
finally:
 cleanup_errors=[]
 for name in reversed(containers):
  p=docker(['rm','-f','-v',name],check=False)
  if p.returncode:cleanup_errors.append('container '+name)
 if volume_created:
  p=docker(['volume','rm',volume],check=False)
  if p.returncode:cleanup_errors.append('volume '+volume)
 if network_created:
  p=docker(['network','rm',network],check=False)
  if p.returncode:cleanup_errors.append('network '+network)
 if image_created:
  p=docker(['image','rm',candidate],check=False)
  if p.returncode:cleanup_errors.append('image '+candidate)
 for kind,args in [('containers',['ps','-aq']),('volumes',['volume','ls','-q']),('networks',['network','ls','-q']),('images',['image','ls','-q'])]:
  p=docker(args+['--filter','label='+label],check=False)
  if p.returncode or p.stdout.strip():cleanup_errors.append('remaining or unverified '+kind)
 result['resources_cleaned']=not cleanup_errors;result['cleanup_errors']=cleanup_errors
 (evidence/'result.json').write_text(json.dumps(result,indent=2))
 if 'failure'in result or cleanup_errors:
  print(result.get('failure')or'Fixture cleanup failed',file=sys.stderr);sys.exit(1)
 print(json.dumps(result))
