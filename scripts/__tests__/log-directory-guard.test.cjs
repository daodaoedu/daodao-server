const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {sourceFor,checkAncestors}=require('../log-directory-guard.cjs');
const {prepare}=require('../prepare-log-directory.cjs');
const config=source=>({services:{dev_app:{volumes:[{type:'bind',source,target:'/app/logs'}]},prod_app:{volumes:[{type:'bind',source:'/checkout/logs',target:'/app/logs'}]}}});
test('guard rejects unknown service, checkout overlap and every other bind overlap',()=>{
 assert.equal(sourceFor(config('/external/dev'),'/checkout','dev_app'),'/external/dev');
 assert.throws(()=>sourceFor(config('/external/dev'),'/checkout','unknown_app'));
 assert.throws(()=>sourceFor(config('/checkout/dev'),'/checkout','dev_app'));
 for(const other of ['/','/external','/external/dev/data','/external/dev']) {
  const c=config('/external/dev'); c.services.other={volumes:[{type:'bind',source:other,target:'/data'}]};
  assert.throws(()=>sourceFor(c,'/checkout','dev_app'));
 }
});
test('symlink ancestor fails even when leaf is missing; dry-run never creates',()=>{
 const dir=fs.mkdtempSync('/tmp/daodao-506-guard-');
 try {
  fs.symlinkSync(dir,`${dir}/alias`);
  assert.throws(()=>checkAncestors(`${dir}/alias/missing/dev`));
  // macOS /tmp is an alias; synthetic lexical ancestors are rejected too.
  const actual=fs.realpathSync(dir);
  if(fs.statSync(actual).uid===0) {
   fs.chmodSync(actual,0o755);
   assert.equal(prepare(config(`${actual}/dev`),'/checkout','dev_app').action,'would-create');
   assert.equal(fs.existsSync(`${actual}/dev`),false);
  } else {
   assert.throws(()=>prepare(config(`${actual}/dev`),'/checkout','dev_app'));
   assert.equal(fs.existsSync(`${actual}/dev`),false);
  }
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('explicit service allowlist requires its own unique leaf and rejects cross-environment overlap',()=>{
 for (const [service,leaf] of [['dev_app','dev'],['prod_app','prod'],['production_app','production']]) {
  const make=source=>({services:{[service]:{volumes:[{type:'bind',source,target:'/app/logs'}]}}});
  assert.equal(sourceFor(make(`/external/${leaf}`),'/checkout',service),`/external/${leaf}`);
  for(const wrong of ['dev','prod','production'].filter(x=>x!==leaf)) assert.throws(()=>sourceFor(make(`/external/${wrong}`),'/checkout',service));
  for(const other of ['/external',`/external/${leaf}/nested`,`/external/${leaf}`]) {
   const c=make(`/external/${leaf}`); c.services.other={volumes:[{type:'bind',source:other,target:'/data'}]};
   assert.throws(()=>sourceFor(c,'/checkout',service));
  }
 }
});
