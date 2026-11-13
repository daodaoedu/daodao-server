import type { Prisma } from '../../generated/prisma';
import { z } from 'zod';
import { createHash } from 'node:crypto';

export const BLOG_REGISTRATION_SOURCE_ACTION = 'blog_registration_source';
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
export const blogSourceTouchSchema = z.object({
  articleId: slug, articleSlug: slug, locale: z.enum(['zh-TW', 'en']),
  source: z.enum(['search', 'social', 'internal', 'unknown']),
  occurredAt: z.string().datetime({ offset: true })
}).strict();
const contextSchema = z.object({
  version: z.literal(1), contextId: z.string().uuid(), ttlSeconds: z.number().int().positive(),
  first: blogSourceTouchSchema, lastAssist: blogSourceTouchSchema
}).strict();
export const blogSourceReleaseSchema = z.object({ id: z.string().regex(/^[a-f0-9]{64}$/), frontend_sha: z.string().regex(/^[a-f0-9]{40}$/), content_sha: z.string().regex(/^[a-f0-9]{40}$/), baseline_sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const storedBlogSourceSchema = z.object({
  contextId: z.string().uuid(), confidence: z.literal('browser_reported'),
  first: blogSourceTouchSchema, lastAssist: blogSourceTouchSchema, release: blogSourceReleaseSchema
}).strict();
export type StoredBlogSource = z.infer<typeof storedBlogSourceSchema>;
type Config = { ttlSeconds?: string; domain?: string; publishedOrigin?: string };
type PublishedRegistry = { release: z.infer<typeof blogSourceReleaseSchema>; articles: Record<string, { published_at: string; slugs: { 'zh-TW': string; en: string } }> };
const deploymentConfig = (): Config => ({ ttlSeconds: process.env.BLOG_SOURCE_CONTEXT_TTL_SECONDS, domain: process.env.BLOG_SOURCE_CONTEXT_DOMAIN, publishedOrigin: process.env.BLOG_SOURCE_PUBLISHED_ORIGIN });
const baselineSchema = z.record(slug, z.object({ published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slugs: z.object({ 'zh-TW': slug, en: slug }).strict() }).strict());
const registryCache = new Map<string, PublishedRegistry>();
const ready = Symbol('prepared-public-blog-context');
export type PreparedBlogRegistrationSource = { readonly [ready]: true; context: z.infer<typeof contextSchema>; release: PublishedRegistry['release'] };

/** Fetch only the publisher's two fixed public protocol paths, with no redirects or caller-controlled URLs. */
const boundedJson = async (origin: string, resource: string, fetcher: typeof fetch): Promise<{raw:string;value:unknown}> => {
  const response = await fetcher(origin + resource, { redirect: 'error', signal: AbortSignal.timeout(2000), headers: { Accept: 'application/json' } });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Published protocol unavailable');
  if (Number(response.headers.get('content-length') ?? 0) > 131072) throw new Error('Published protocol exceeds limit');
  if (!response.body) throw new Error('Missing published protocol');
  const reader = response.body.getReader(); const chunks: Uint8Array[]=[]; let bytes=0;
  try { while(true) { const part=await reader.read(); if(part.done)break;bytes+=part.value.byteLength;if(bytes>131072)throw new Error('Published protocol exceeds limit');chunks.push(part.value); } } finally { await reader.cancel().catch(()=>undefined); }
  const raw=Buffer.concat(chunks).toString('utf8');return {raw,value:JSON.parse(raw)};
};
const readPublishedRegistry = async (config: Config, fetcher: typeof fetch): Promise<PublishedRegistry> => {
  const origin = new URL(config.publishedOrigin ?? '');
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || !(origin.protocol === 'https:' || origin.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(origin.hostname))) throw new Error('Invalid trusted published origin');
  const manifest=blogSourceReleaseSchema.parse((await boundedJson(origin.origin,'/blog-release.json',fetcher)).value);
  const key=origin.origin+':'+JSON.stringify(manifest); const cached=registryCache.get(key); if(cached)return cached;
  const baseline=await boundedJson(origin.origin,'/blog-published-baseline.json',fetcher);
  if(createHash('sha256').update(baseline.raw).digest('hex')!==manifest.baseline_sha256)throw new Error('Published baseline digest mismatch');
  const result={release:manifest,articles:baselineSchema.parse(baseline.value)};
  if(registryCache.size>=8)registryCache.clear();registryCache.set(key,result);return result;
};

/** Context is a browser claim, never an authentication credential. Missing deployment settings mean unknown. */
export const parseBlogRegistrationContext = (raw: unknown, now: Date, config: Config, registry: PublishedRegistry): z.infer<typeof contextSchema> | null => {
  const ttl = Number(config.ttlSeconds);
  if (!config.ttlSeconds || !Number.isSafeInteger(ttl) || ttl <= 0 || ttl * 1000 > Number.MAX_SAFE_INTEGER || !config.domain || !/^\.?[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(config.domain)) return null;
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  try {
    const parsed = contextSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.ttlSeconds !== ttl) return null;
    if (![parsed.data.first, parsed.data.lastAssist].every(touch => registry.articles[touch.articleId]?.slugs[touch.locale] === touch.articleSlug)) return null;
    const first = new Date(parsed.data.first.occurredAt).valueOf();const last = new Date(parsed.data.lastAssist.occurredAt).valueOf();
    if (first > last || last > now.valueOf() || now.valueOf() - first >= ttl * 1000) return null;
    return parsed.data;
  } catch { return null; }
};

/** This preflight runs before registration's DB transaction. Failure never blocks registration or falls back to raw SDK data. */
export const prepareBlogRegistrationSource = async (raw: unknown, now = new Date(), config: Config = deploymentConfig(), fetcher: typeof fetch = fetch): Promise<PreparedBlogRegistrationSource | null> => {
  if(!config.ttlSeconds || !config.domain || !config.publishedOrigin || typeof raw!=='string' || raw.length>2048)return null;
  try {const registry=await readPublishedRegistry(config,fetcher);const context=parseBlogRegistrationContext(raw,now,config,registry);return context?{[ready]:true,context,release:registry.release}:null;}catch{return null;}
};

type SourceDb = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>;
/** Called only inside new permanent registration TX; admin_id is the sole account linkage and its existing FK unlinks on deletion. */
export const recordBlogRegistrationSource = async (db: SourceDb, user: { id: number; verified: boolean | null }, prepared: PreparedBlogRegistrationSource | null | undefined, clock: () => Date = () => new Date()): Promise<void> => {
  if (!user.verified) return;
  if (!prepared || prepared[ready] !== true) return;
  const { context, release } = prepared;
  // Recheck after public preflight/transaction wait, so expiry cannot race account creation.
  const validAtCapture = (): boolean => { const now=clock();return now.valueOf()-new Date(context.first.occurredAt).valueOf()<context.ttlSeconds*1000 && new Date(context.lastAssist.occurredAt)<=now; };
  if (!validAtCapture()) return;
  // Serialize claims across registrations, including different actors. Never reassign a claimed context after deletion.
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${context.contextId}, 538))`;
  const existing = await db.$queryRaw<{ admin_id: number | null }[]>`
    SELECT admin_id FROM audit_logs WHERE action_type=${BLOG_REGISTRATION_SOURCE_ACTION}
    AND target_resource='blog_source_context' AND target_id=${context.contextId} LIMIT 1
  `;
  if (existing.length || !validAtCapture()) return;
  const value: StoredBlogSource = { contextId: context.contextId, confidence: 'browser_reported', first: context.first, lastAssist: context.lastAssist, release };
  await db.$executeRaw`
    INSERT INTO audit_logs(admin_id, action_type, target_resource, target_id, new_value)
    VALUES(${user.id}, ${BLOG_REGISTRATION_SOURCE_ACTION}, 'blog_source_context', ${context.contextId}, ${JSON.stringify(value)}::jsonb)
  `;
};
