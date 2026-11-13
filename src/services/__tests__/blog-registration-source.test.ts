import { createHash } from 'node:crypto';
import { parseBlogRegistrationContext, prepareBlogRegistrationSource, recordBlogRegistrationSource } from '../blog-registration-source.service';
const now = new Date('2026-11-13T00:00:00Z');
const touch = { articleId: 'learning-group-check-in', articleSlug: 'learning-group-check-in', locale: 'zh-TW', source: 'search', occurredAt: '2026-11-12T23:59:50Z' };
const context = { version: 1, contextId: 'b234056c-3bf6-49cb-9025-bc38c5eef789', ttlSeconds: 120, first: touch, lastAssist: touch };
const articles = {'learning-group-check-in':{published_at:'2026-11-13',slugs:{'zh-TW':'learning-group-check-in',en:'learning-group-check-in'}}};
const rawBaseline=JSON.stringify(articles);
const release={id:'1'.repeat(64),frontend_sha:'2'.repeat(40),content_sha:'3'.repeat(40),baseline_sha256:createHash('sha256').update(rawBaseline).digest('hex')};
const registry={release,articles};
const config = { ttlSeconds: '120', domain: '.daodao.test', publishedOrigin:'https://published.fixture.test' };
const fetcher=jest.fn(async(url: string)=>new Response(url.endsWith('/blog-release.json')?JSON.stringify(release):rawBaseline,{headers:{'content-type':'application/json'}}));
describe('registration source contract', () => {
  beforeEach(()=>fetcher.mockClear());
  it('requires matching deployment settings, known published articles, and valid chronology', () => {
    expect(parseBlogRegistrationContext(JSON.stringify(context),now,config,registry)?.contextId).toBe(context.contextId);
    for (const value of [undefined,'{}','{"email":"private@fixture.test"}',JSON.stringify({...context,ttlSeconds:121}),JSON.stringify({...context,first:{...touch,occurredAt:'2026-11-14T00:00:00Z'}}),JSON.stringify({...context,first:{...touch,occurredAt:'2026-11-12T00:00:00Z'}}),JSON.stringify({...context,first:{...touch,articleId:'private-person-token'}})]) expect(parseBlogRegistrationContext(value,now,config,registry)).toBeNull();
    expect(parseBlogRegistrationContext(JSON.stringify(context),now,{},registry)).toBeNull();
    expect(parseBlogRegistrationContext(JSON.stringify(context),now,{...config,domain:'.com'},registry)).toBeNull();
  });
  it('preflights only fixed publisher paths and carries release proof; missing/unavailable/hash-mismatch becomes unknown',async()=>{
    const prepared=await prepareBlogRegistrationSource(JSON.stringify(context),now,config,fetcher as typeof fetch);
    expect(prepared?.release).toEqual(release);
    expect(fetcher.mock.calls.map(call=>call[0])).toEqual(['https://published.fixture.test/blog-release.json','https://published.fixture.test/blog-published-baseline.json']);
    expect(await prepareBlogRegistrationSource(JSON.stringify(context),now,{},fetcher as typeof fetch)).toBeNull();
    expect(await prepareBlogRegistrationSource(JSON.stringify(context),now,{...config,publishedOrigin:'https://bad.fixture.test/'},(async()=>new Response('{}',{headers:{'content-type':'application/json'}})) as typeof fetch)).toBeNull();
  });
  it('rejects digest mismatch, oversized/redirected publisher responses and private oversized input',async()=>{
    const mismatch=(async(url:string)=>new Response(url.endsWith('/blog-release.json')?JSON.stringify(release):'{}',{headers:{'content-type':'application/json'}})) as typeof fetch;
    expect(await prepareBlogRegistrationSource(JSON.stringify(context),now,{...config,publishedOrigin:'https://digest-mismatch.fixture.test'},mismatch)).toBeNull();
    const oversized=(async()=>new Response('{}',{headers:{'content-type':'application/json','content-length':'131073'}})) as typeof fetch;
    expect(await prepareBlogRegistrationSource(JSON.stringify(context),now,{...config,publishedOrigin:'https://oversized.fixture.test'},oversized)).toBeNull();
    const redirect=(async()=>new Response(null,{status:302,headers:{location:'https://untrusted.fixture.test'}})) as typeof fetch;
    expect(await prepareBlogRegistrationSource(JSON.stringify(context),now,{...config,publishedOrigin:'https://redirect.fixture.test'},redirect)).toBeNull();
    fetcher.mockClear();expect(await prepareBlogRegistrationSource('x'.repeat(2049),now,config,fetcher as typeof fetch)).toBeNull();expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not bind a context expiring while the claim lock is awaited',async()=>{
    const prepared=await prepareBlogRegistrationSource(JSON.stringify(context),now,config,fetcher as typeof fetch);
    const db={$executeRaw:jest.fn().mockResolvedValue(1),$queryRaw:jest.fn().mockResolvedValue([])};
    const clock=jest.fn().mockReturnValueOnce(now).mockReturnValueOnce(new Date(now.valueOf()+120000));
    await recordBlogRegistrationSource(db as never,{id:1,verified:true},prepared,clock);
    expect(db.$executeRaw).toHaveBeenCalledTimes(1);
  });
  it('never binds unverified identities, invalid context, or a previously claimed context to another actor',async()=>{
    const prepared=await prepareBlogRegistrationSource(JSON.stringify(context),now,config,fetcher as typeof fetch);
    const db={$executeRaw:jest.fn().mockResolvedValue(1),$queryRaw:jest.fn().mockResolvedValue([{admin_id:77}])};
    await recordBlogRegistrationSource(db as never,{id:1,verified:false},prepared,()=>now);
    await recordBlogRegistrationSource(db as never,{id:1,verified:true},null,()=>now);
    await recordBlogRegistrationSource(db as never,{id:1,verified:true},prepared,()=>new Date(now.valueOf()+120000));
    expect(db.$executeRaw).not.toHaveBeenCalled();
    await recordBlogRegistrationSource(db as never,{id:1,verified:true},prepared,()=>now);
    expect(db.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
