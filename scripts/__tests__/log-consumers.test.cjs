const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const repo=path.resolve(__dirname,'../..');
// Global deny-first sandbox: no child may fall through to a real external tool.
const denyRoot=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'log-deny-tools-')));
const deniedCalls=path.join(denyRoot,'denied-calls');
for(const name of ['ssh','rsync','scp','crontab','mail','mailx','sendmail']){
 const file=path.join(denyRoot,name);
 fs.writeFileSync(file,'#!/bin/bash\necho "External tool requires explicit stub: '+name+'" >&2\necho '+name+' >> "'+deniedCalls+'"\nexit 98\n');fs.chmodSync(file,0o755);
}
process.env.PATH=denyRoot+':'+process.env.PATH;
for(const key of Object.keys(process.env)) if(/^(SSH_|RSYNC_|BASH_ENV$|ENV$|DAODAO_LOG_ROOT$)/.test(key)) delete process.env[key];
const provenance={denyFirst:true,tools:['ssh','rsync','scp','crontab','mail','mailx','sendmail'],sanitized:['SSH_*','RSYNC_*','BASH_ENV','ENV','DAODAO_LOG_ROOT'],explicitStubs:['download mapping: ssh+rsync','cron: crontab','ancestor alias: ssh executes only synthetic metadata guard + rsync recorder']};
after(()=>{
 const calls=fs.existsSync(deniedCalls)?fs.readFileSync(deniedCalls,'utf8'):'';
 if(process.env.LOG_CONSUMER_EVIDENCE) fs.writeFileSync(process.env.LOG_CONSUMER_EVIDENCE,JSON.stringify({...provenance,unexpectedCalls:calls.trim().split('\n').filter(Boolean)},null,2)+'\n');
 fs.rmSync(denyRoot,{recursive:true,force:true});assert.equal(calls,'','An external tool was invoked without an explicit test stub');
});

test('consumers require an explicit environment before external calls',()=>{
 for(const script of ['scripts/download-logs.sh','scripts/log-monitor.sh','scripts/other/download-logs.sh','scripts/other/log-monitor.sh','scripts/other/setup-log-backup-cron.sh']) {
 const r=spawnSync('bash',[path.join(repo,script)],{encoding:'utf8'});assert.notEqual(r.status,0,script);assert.match(r.stderr,/--env/);
 }
});
test('monitor reads only selected dev dated files and refuses missing source',()=>{
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'log-consumers-')));try{
 fs.mkdirSync(path.join(root,'dev'));fs.writeFileSync(path.join(root,'dev/dev-error-2026-11-08.log'),'DEV_VISIBLE');fs.writeFileSync(path.join(root,'dev/prod-error-2026-11-08.log'),'PROD_HIDDEN');
 const run=()=>spawnSync('bash',[path.join(repo,'scripts/log-monitor.sh'),'--env','dev'],{encoding:'utf8',env:{...process.env,DAODAO_LOG_ROOT:root}});
 let r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/DEV_VISIBLE/);assert.doesNotMatch(r.stdout,/PROD_HIDDEN|prod-error/);
 fs.rmSync(path.join(root,'dev'),{recursive:true});r=run();assert.notEqual(r.status,0);assert.equal(fs.existsSync(path.join(root,'dev')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('download selects remote source/filter and never falls back or deletes remote data',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'log-download-'));try{
 const bin=path.join(root,'bin');fs.mkdirSync(bin);const trace=path.join(root,'trace');
 for(const name of ['ssh','rsync']){fs.writeFileSync(path.join(bin,name),'#!/bin/bash\nprintf "%s\\n" "$0 $*" >> "$TRACE"\n'+(name==='ssh'?'exit "${SSH_STATUS:-0}"\n':'exit 0\n'));fs.chmodSync(path.join(bin,name),0o755);}
 const run=(env,extra={})=>spawnSync('bash',[path.join(repo,'scripts/other/download-logs.sh'),'--env',env],{cwd:root,encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,TRACE:trace,DAODAO_LOG_ROOT:'/fixture/new',...extra}});
 for(const env of ['dev','prod','production','legacy']){fs.writeFileSync(trace,'');const r=run(env);assert.equal(r.status,0,r.stderr);const calls=fs.readFileSync(trace,'utf8');assert.match(calls,new RegExp(env==='dev'?'/fixture/new/dev':'/root/daodao-server/logs'));if(env!=='legacy')assert.ok(calls.includes('--include=/'+(env==='dev'?'dev':'prod')+'-*.log*'));assert.doesNotMatch(calls,/--delete|remove-source|scp/);}
 fs.writeFileSync(trace,'');const r=run('dev',{SSH_STATUS:'1'});assert.notEqual(r.status,0);assert.doesNotMatch(fs.readFileSync(trace,'utf8'),/rsync|\/root\/daodao/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('cron installer pins environment and root in generated wrapper using only stub crontab',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'log-cron-'));try{
 fs.cpSync(path.join(repo,'scripts'),path.join(root,'scripts'),{recursive:true});const bin=path.join(root,'bin');fs.mkdirSync(bin);const state=path.join(root,'crontab');fs.writeFileSync(state,'');
 fs.writeFileSync(path.join(bin,'crontab'),'#!/bin/bash\nif [ "$1" = -l ]; then cat "$STATE"; else cat > "$STATE"; fi\n');fs.chmodSync(path.join(bin,'crontab'),0o755);
 const r=spawnSync('bash',[path.join(root,'scripts/other/setup-log-backup-cron.sh'),'--env','dev'],{input:'1\n',encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,STATE:state,DAODAO_LOG_ROOT:'/fixture/new'}});assert.equal(r.status,0,r.stderr);
 const wrapper=fs.readFileSync(path.join(root,'scripts/other/download-logs-dev-cron-wrapper.sh'),'utf8');assert.match(wrapper,/export DAODAO_LOG_ROOT=\/fixture\/new/);assert.match(wrapper,/LOG_ENV=dev/);assert.match(wrapper,/--env "\$LOG_ENV"/);assert.match(fs.readFileSync(state,'utf8'),/download-logs-dev-cron-wrapper/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('dev consumers reject ancestor symlink aliases locally and in executed remote metadata command',()=>{
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'log-alias-')));try{
 fs.mkdirSync(path.join(root,'legacy/dev'),{recursive:true});fs.writeFileSync(path.join(root,'legacy/dev/dev-error-2026-11-08.log'),'ALIAS_SECRET');fs.symlinkSync(path.join(root,'legacy'),path.join(root,'alias'));
 const bin=path.join(root,'bin');fs.mkdirSync(bin);const trace=path.join(root,'trace');
 fs.writeFileSync(path.join(bin,'ssh'),'#!/bin/bash\nprintf "%s\\n" "$*" >> "$TRACE"\nsh -c "${@: -1}"\n');fs.chmodSync(path.join(bin,'ssh'),0o755);
 fs.writeFileSync(path.join(bin,'rsync'),'#!/bin/bash\necho RSYNC_CALLED >> "$TRACE"\n');fs.chmodSync(path.join(bin,'rsync'),0o755);
 for(const script of ['scripts/log-monitor.sh','scripts/download-logs.sh']){const r=spawnSync('bash',[path.join(repo,script),'--env','dev'],{cwd:root,encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,TRACE:trace,DAODAO_LOG_ROOT:path.join(root,'alias')}});assert.notEqual(r.status,0,script);assert.doesNotMatch(r.stdout,/ALIAS_SECRET/);}
 assert.doesNotMatch(fs.readFileSync(trace,'utf8'),/RSYNC_CALLED/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('dev scope rejects legacy/checkout nesting and ambiguous roots before external access',()=>{
 for(const root of ['/root/daodao-server/logs','/root/daodao-server',repo,path.join(repo,'logs'),'/var/log/../legacy','/var//log','relative']){
 const r=spawnSync('bash',['-c','source "$1"; log_consumer_scope --env dev','scope-test',path.join(repo,'scripts/log-consumer-scope.sh')],{encoding:'utf8',env:{...process.env,DAODAO_LOG_ROOT:root}});assert.notEqual(r.status,0,root);assert.match(r.stderr,/Unsafe|overlap|absolute/);
 }
});
test('cron cancellation and failed install preserve existing wrapper and schedule; approval updates both',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'log-cron-update-'));try{
 fs.cpSync(path.join(repo,'scripts'),path.join(root,'scripts'),{recursive:true});const bin=path.join(root,'bin');fs.mkdirSync(bin);const state=path.join(root,'crontab');fs.writeFileSync(state,'# unrelated\n0 1 * * * unrelated-job\n');
 fs.writeFileSync(path.join(bin,'crontab'),'#!/bin/bash\nif [ "$1" = -l ]; then cat "$STATE"; elif [ "${FAIL_INSTALL:-0}" = 1 ]; then cat >/dev/null; exit 37; else cat > "$STATE"; fi\n');fs.chmodSync(path.join(bin,'crontab'),0o755);
 const run=(logRoot,input,extra={})=>spawnSync('bash',[path.join(root,'scripts/other/setup-log-backup-cron.sh'),'--env','dev'],{input,encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,STATE:state,DAODAO_LOG_ROOT:logRoot,...extra}});
 const wrapperPath=path.join(root,'scripts/other/download-logs-dev-cron-wrapper.sh');const initialCron=fs.readFileSync(state);const failedInitial=run('/fixture/old','1\n',{FAIL_INSTALL:'1'});assert.notEqual(failedInitial.status,0);assert.equal(fs.existsSync(wrapperPath),false,'failed initial install leaves no wrapper');assert.deepEqual(fs.readFileSync(state),initialCron);
 assert.equal(run('/fixture/old','1\n').status,0);const oldWrapper=fs.readFileSync(wrapperPath);const oldCron=fs.readFileSync(state);
 let r=run('/fixture/new','2\nn\n');assert.equal(r.status,0,r.stderr);assert.deepEqual(fs.readFileSync(wrapperPath),oldWrapper,'cancel must preserve active source');assert.deepEqual(fs.readFileSync(state),oldCron,'cancel must preserve schedule');
 r=run('/fixture/new','2\ny\n',{FAIL_INSTALL:'1'});assert.notEqual(r.status,0);assert.deepEqual(fs.readFileSync(wrapperPath),oldWrapper,'crontab failure must restore wrapper');assert.deepEqual(fs.readFileSync(state),oldCron,'crontab failure preserves prior schedule');
 r=run('/fixture/new','2\ny\n');assert.equal(r.status,0,r.stderr);assert.match(fs.readFileSync(wrapperPath,'utf8'),/DAODAO_LOG_ROOT=\/fixture\/new/);assert.notDeepEqual(fs.readFileSync(state),oldCron);assert.match(fs.readFileSync(state,'utf8'),/0 2 \* \* 0/);assert.match(fs.readFileSync(state,'utf8'),/unrelated-job/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('cron read errors fail closed while explicit no-crontab permits first install',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'log-cron-read-'));try{
 fs.cpSync(path.join(repo,'scripts'),path.join(root,'scripts'),{recursive:true});const bin=path.join(root,'bin');fs.mkdirSync(bin);const state=path.join(root,'crontab');fs.writeFileSync(state,'0 1 * * * unrelated-job\n');const writes=path.join(root,'writes');
 fs.writeFileSync(path.join(bin,'crontab'),'#!/bin/bash\nif [ "$1" = -l ]; then\n case "${READ_MODE:-ok}" in error) echo "crontab: permission denied" >&2; exit 1;; absent) echo "no crontab for fixture-user" >&2; exit 1;; esac\n cat "$STATE"\nelse echo write >> "$WRITES"; cat > "$STATE"; fi\n');fs.chmodSync(path.join(bin,'crontab'),0o755);
 const wrapper=path.join(root,'scripts/other/download-logs-dev-cron-wrapper.sh');fs.writeFileSync(wrapper,'#!/bin/bash\n# existing wrapper\n');const oldWrapper=fs.readFileSync(wrapper);const oldCron=fs.readFileSync(state);
 const run=(mode)=>spawnSync('bash',[path.join(root,'scripts/other/setup-log-backup-cron.sh'),'--env','dev'],{input:'1\ny\n',encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,STATE:state,WRITES:writes,READ_MODE:mode,DAODAO_LOG_ROOT:'/fixture/new'}});
 let r=run('error');assert.notEqual(r.status,0,'unknown list error must abort');assert.deepEqual(fs.readFileSync(wrapper),oldWrapper);assert.deepEqual(fs.readFileSync(state),oldCron);assert.equal(fs.existsSync(writes),false);
 fs.unlinkSync(wrapper);fs.writeFileSync(state,'');r=run('absent');assert.equal(r.status,0,r.stderr);assert.match(fs.readFileSync(wrapper,'utf8'),/DAODAO_LOG_ROOT=\/fixture\/new/);assert.match(fs.readFileSync(state,'utf8'),/download-logs-dev-cron-wrapper/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
