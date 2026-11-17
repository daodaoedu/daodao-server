// Fail closed before loading application modules outside the owned disposable runner.
require("../../../tests/integration/auth/__tests__/oauth-environment.cjs");
import "../../config/openapi-registry";
import express from "express";
import http from "node:http";
import { tmpdir } from "node:os";
import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { prisma } from "../database/prisma.service";
import redis from "../database/redis.service";
import organizationRoutes from "../../routes/organization.routes";
import joinRoutes from "../../routes/cohort-join.routes";
import practiceRoutes from "../../routes/practice.routes";
import userRoutes from "../../routes/user.routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "../../routes/auth.routes";
import onboardingRoutes from "../../routes/onboarding.routes";
import quizRoutes from "../../routes/quiz.routes";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

import { BLOG_REGISTRATION_SOURCE_ACTION, prepareBlogRegistrationSource, recordBlogRegistrationSource } from "../blog-registration-source.service";
import { globalErrorHandler } from "../../middleware/error.middleware";
import { LIGHTHOUSE_AUDIT_ACTIONS } from "../../constants/audit-action";
import { exportBlogActivationEvidence } from "../blog-activation-export.service";

// Only delivery transports are replaced; actual auth, routes, services and PostgreSQL remain live.
jest.mock("../../queues/email.queue", () => ({
	bulkEnqueueEmails: jest.fn().mockResolvedValue([]),
	enqueueEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../queues", () => ({
	enqueuePracticeEmail: jest.fn().mockResolvedValue(undefined),
}));
const app = express();
// Test-only allowlist; production CORS configuration is unchanged.
app.use(cors({ origin: ['https://app.daodao.so', 'http://app.daodao.test:8559'], credentials: true }));
app.use(cookieParser());
app.use(express.json());
// Exact 536 release protocol fixture; TEST ONLY, not human approval or this frontend build.
for (const resource of ['blog-release.json','blog-published-baseline.json']) {
 const bytes=readFileSync(path.join(__dirname,'fixtures/blog-source',resource));
 app.get('/'+resource,(_req,res)=>res.type('application/json').send(bytes));
}
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/lighthouse", organizationRoutes);
app.use("/api/v1/cohorts", joinRoutes);
app.use("/api/v1/practices", practiceRoutes);
app.use(globalErrorHandler);
const server = http.createServer(app);
const run = randomUUID();
// Explicit TEST ONLY deployment configuration, not production policy.
process.env.BLOG_SOURCE_CONTEXT_TTL_SECONDS = '600';
process.env.BLOG_SOURCE_CONTEXT_DOMAIN = '.daodao.test';

const qaDirectory = process.env.BLOG_SOURCE_BROWSER_QA_DIR;
let browserSourceContext: ReturnType<typeof sourceContext> | undefined;
if (qaDirectory) jest.setTimeout(15 * 60 * 1000);
const sourceContext = () => {
 const touch = {articleId:'learning-group-check-in',articleSlug:'learning-group-check-in',locale:'zh-TW',source:'search',occurredAt:new Date(Date.now()-1000).toISOString()};
 return {version:1,contextId:randomUUID(),ttlSeconds:600,first:touch,lastAssist:touch};
};
async function registeredAccount(name: string, rawContext?: string) {
 const email = `${name}-${randomUUID()}@fixture.example.test`;
 const temp = await prisma.temp_users.create({data:{email,name:`${name.slice(0,15)}-${randomUUID().slice(0,8)}`,verified_login_email:email}});
 const tempToken = jwt.sign({id:temp.id,isTemp:true},process.env.JWT_SECRET!,{expiresIn:'1h'});
 if (qaDirectory && name === 'leader') {
  const address=server.address();if(!address || typeof address==='string')throw new Error('Missing owned loopback server');
  await fs.mkdir(qaDirectory,{recursive:true,mode:0o700});
  await fs.rm(path.join(qaDirectory,'result.json'),{force:true});
  await fs.writeFile(path.join(qaDirectory,'ready.json'),JSON.stringify({apiOrigin:`http://localhost:${address.port}`,tempJWT:tempToken,tempEmail:email}),{mode:0o600});
  console.log('BROWSER_QA_READY private fixture ready; awaiting real onboarding');
  const deadline=Date.now()+12*60*1000;
  while(Date.now()<deadline){
   try {const result=JSON.parse(await fs.readFile(path.join(qaDirectory,'result.json'),'utf8'));browserSourceContext=result.context;break;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
   await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!browserSourceContext)throw new Error('Timed out waiting for actual browser onboarding');
  return prisma.users.findFirstOrThrow({where:{verified_login_email:email}});
 }
 let req = request(server).post('/api/v1/users/me').set('Authorization',`Bearer ${tempToken}`);
 if(rawContext !== undefined) req=req.set('X-Daodao-Blog-Context',rawContext);
 const result = await req.send({name:temp.name,customId:`f${randomUUID().replace(/-/g,'').slice(0,20)}`,isSendEmail:false});
 trace.push({label:'actual-temp-to-permanent-registration',status:result.status});
 expect(result.status).toBe(201);
 return prisma.users.findFirstOrThrow({where:{verified_login_email:email}});
}
const trace: unknown[] = [];
const token = (id: number) =>
	jwt.sign({ id, isTemp: false }, process.env.JWT_SECRET!, { expiresIn: "1h" });
async function account(name: string) {
	const contact = await prisma.contacts.create({
		data: { email: `${name}-${run}@fixture.example.test` },
	});
	const role = await prisma.roles.upsert({
		where: { name: "User" },
		create: { name: "User" },
		update: {},
	});
	return prisma.users.create({
		data: {
			mongo_id: randomUUID(),
			created_at: new Date(),
			nickname: name,
			contact_id: contact.id,
			role_id: role.id,
			is_active: true,
			verified: true,
		},
	});
}
function recorded(label: string, response: request.Response) {
	trace.push({ label, status: response.status, body: response.body });
	return response;
}
beforeAll(async () => {
	await new Promise<void>((resolve) => server.listen(Number(process.env.BLOG_SOURCE_BROWSER_QA_PORT ?? 0), "127.0.0.1", resolve));
 const address=server.address();if(!address || typeof address==='string')throw new Error('Missing local fixture');
 process.env.BLOG_SOURCE_PUBLISHED_ORIGIN=`http://localhost:${address.port}`;
});
afterAll(async () => {
	console.log("HTTP_FIXTURE_READBACK", JSON.stringify(trace));
	server.closeIdleConnections();
	await new Promise<void>((resolve, reject) =>
		server.close((e) => (e ? reject(e) : resolve())),
	);
	await prisma.$disconnect();
	redis.removeAllListeners("close");
	await redis.quit();
	await new Promise((resolve) => setImmediate(resolve));
});
it("executes publication, targeted invitation, join and checkin through real HTTP and isolates manager/member/outsider evidence", async () => {
	let blogContext = sourceContext();
	const leader = await registeredAccount("leader", JSON.stringify(blogContext)),
		member = await account("member"),
		outsider = await account("outsider");
 if(browserSourceContext)blogContext=browserSourceContext;
	const org = await prisma.organization.create({
		data: { name: `538-${run}`, status: "active" },
	});
	await prisma.organization_members.create({
		data: { organization_id: org.id, user_id: leader.id, role: "owner" },
	});
	const program = await prisma.programs.create({
		data: { organization_id: org.id, name: "538-fixture", kind: "lighthouse" },
	});
	const base = `/api/v1/lighthouse/programs/${program.id}/cohorts`;
	let res = recorded(
		"unauthenticated-create",
		await request(server).post(base).send({}),
	);
	expect(res.status).toBe(401);
	res = recorded(
		"outsider-create",
		await request(server)
			.post(base)
			.auth(token(outsider.id), { type: "bearer" })
			.send({
				slug: "fixture",
				displayName: "538 fixture",
				startDate: "2026-01-01",
				endDate: "2099-12-31",
			}),
	);
	expect(res.status).toBe(403);
	expect(res.text).not.toContain(run);
	res = recorded(
		"leader-create",
		await request(server)
			.post(base)
			.auth(token(leader.id), { type: "bearer" })
			.send({
				slug: "fixture",
				displayName: "538 fixture",
				startDate: "2026-01-01",
				endDate: "2099-12-31",
				status: "draft",
			}),
	);
	expect(res.status).toBe(201);
	const cohort = await prisma.cohorts.findFirstOrThrow({
		where: { program_id: program.id },
	});
	const endpoint = `${base}/${cohort.id}`;
	res = recorded(
		"leader-publish",
		await request(server)
			.patch(endpoint)
			.auth(token(leader.id), { type: "bearer" })
			.send({ status: "published" }),
	);
	expect(res.status).toBe(200);
	const email = (
		await prisma.contacts.findUniqueOrThrow({
			where: { id: member.contact_id! },
		})
	).email!;
	res = recorded(
		"targeted-invitation",
		await request(server)
			.post(`${endpoint}/invitations`)
			.auth(token(leader.id), { type: "bearer" })
			.send({ emails: [email] }),
	);
	expect(res.status).toBe(201);
	const enrollment = await prisma.cohort_enrollments.findFirstOrThrow({
		where: { cohort_id: cohort.id, email },
	});
	res = recorded(
		"consent-rejected",
		await request(server)
			.post(`/api/v1/cohorts/join/${enrollment.invite_token}`)
			.auth(token(member.id), { type: "bearer" })
			.send({ consent: false }),
	);
	expect(res.status).toBe(400);
	res = recorded(
		"member-join",
		await request(server)
			.post(`/api/v1/cohorts/join/${enrollment.invite_token}`)
			.auth(token(member.id), { type: "bearer" })
			.send({ consent: true }),
	);
	expect(res.status).toBe(201);
	const joinedAt = (
		await prisma.cohort_enrollments.findUniqueOrThrow({
			where: { id: enrollment.id },
		})
	).joined_at;
	res = recorded(
		"joined-retry",
		await request(server)
			.post(`/api/v1/cohorts/join/${enrollment.invite_token}`)
			.auth(token(member.id), { type: "bearer" })
			.send({ consent: true }),
	);
	expect(res.status).toBe(201);
	expect(
		(
			await prisma.cohort_enrollments.findUniqueOrThrow({
				where: { id: enrollment.id },
			})
		).joined_at,
	).toEqual(joinedAt);
	res = recorded(
		"member-home",
		await request(server)
			.get(`/api/v1/cohorts/${cohort.id}`)
			.auth(token(member.id), { type: "bearer" }),
	);
	expect(res.status).toBe(200);
	res = recorded(
		"outsider-home",
		await request(server)
			.get(`/api/v1/cohorts/${cohort.id}`)
			.auth(token(outsider.id), { type: "bearer" }),
	);
	expect(res.status).toBe(404);
	expect(res.text).not.toContain("538 fixture");
	res = recorded(
		"member-exit",
		await request(server)
			.post(`/api/v1/cohorts/${cohort.id}/exit`)
			.auth(token(member.id), { type: "bearer" }),
	);
	expect(res.status).toBe(200);
	res = recorded(
		"exited-home",
		await request(server)
			.get(`/api/v1/cohorts/${cohort.id}`)
			.auth(token(member.id), { type: "bearer" }),
	);
	expect(res.status).toBe(404);
	expect(res.text).not.toContain("538 fixture");
	res = recorded(
		"targeted-reinvite",
		await request(server)
			.post(`${endpoint}/invitations`)
			.auth(token(leader.id), { type: "bearer" })
			.send({ emails: [email] }),
	);
	expect(res.status).toBe(201);
	res = recorded(
		"member-rejoin",
		await request(server)
			.post(`/api/v1/cohorts/join/${enrollment.invite_token}`)
			.auth(token(member.id), { type: "bearer" })
			.send({ consent: true }),
	);
	expect(res.status).toBe(201);
	const joins = await prisma.$queryRaw<
		Array<{ new_value: { joinTransition: string } }>
	>`SELECT new_value FROM audit_logs WHERE action_type=${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_JOINED} AND target_id=${String(enrollment.id)} ORDER BY id`;
	expect(joins).toHaveLength(2);
	expect(new Set(joins.map((row) => row.new_value.joinTransition)).size).toBe(
		2,
	);
	const practice = await prisma.practices.create({
		data: {
			user_id: member.id,
			cohort_id: cohort.id,
			title: "538 private fixture",
			status: "active",
			start_date: new Date(),
			end_date: new Date(Date.now() + 86400000 * 7),
			duration_days: 7,
			frequency_min_days: 1,
			frequency_max_days: 7,
			privacy_status: "private",
			visibility: "private",
		},
	});
	const checkin = `/api/v1/practices/${practice.external_id}/checkins`;
	res = recorded(
		"outsider-checkin",
		await request(server)
			.post(checkin)
			.auth(token(outsider.id), { type: "bearer" })
			.send({
				tags: ["閱讀"],
				mood: "happy",
				note: "PRIVATE_538_MARKER",
				imageUrls: [],
			}),
	);
	expect([403, 404]).toContain(res.status);
	expect(res.text).not.toContain("PRIVATE_538_MARKER");
	res = recorded(
		"member-checkin",
		await request(server)
			.post(checkin)
			.auth(token(member.id), { type: "bearer" })
			.send({
				tags: ["閱讀"],
				mood: "happy",
				note: "PRIVATE_538_MARKER",
				imageUrls: [],
			}),
	);
	expect(res.status).toBe(201);
	res = recorded(
		"outsider-private-read",
		await request(server)
			.get(checkin)
			.auth(token(outsider.id), { type: "bearer" }),
	);
	expect(res.status).toBe(403);
	expect(res.text).not.toContain("PRIVATE_538_MARKER");
	res = recorded("anonymous-private-read", await request(server).get(checkin));
	expect(res.status).toBe(403);
	expect(res.text).not.toContain("PRIVATE_538_MARKER");
	res = recorded(
		"member-private-read",
		await request(server)
			.get(checkin)
			.auth(token(member.id), { type: "bearer" }),
	);
	expect(res.status).toBe(200);
	expect(res.text).toContain("PRIVATE_538_MARKER");
	res = recorded(
		"manager-private-read",
		await request(server)
			.get(checkin)
			.auth(token(leader.id), { type: "bearer" }),
	);
	expect(res.status).toBe(200);
	expect(res.text).toContain("PRIVATE_538_MARKER");
	const peer = await account("peer");
	const peerEmail = (
		await prisma.contacts.findUniqueOrThrow({ where: { id: peer.contact_id! } })
	).email!;
	await prisma.cohort_enrollments.create({
		data: {
			cohort_id: cohort.id,
			user_id: peer.id,
			email: peerEmail,
			status: "joined",
			role: "member",
			joined_at: new Date(),
		},
	});
	res = recorded(
		"peer-private-read",
		await request(server).get(checkin).auth(token(peer.id), { type: "bearer" }),
	);
	expect(res.status).toBe(200);
	expect(res.text).toContain("PRIVATE_538_MARKER");
	res = recorded(
		"peer-exit",
		await request(server)
			.post(`/api/v1/cohorts/${cohort.id}/exit`)
			.auth(token(peer.id), { type: "bearer" }),
	);
	expect(res.status).toBe(200);
	res = recorded(
		"exited-peer-private-read",
		await request(server).get(checkin).auth(token(peer.id), { type: "bearer" }),
	);
	expect(res.status).toBe(403);
	expect(res.text).not.toContain("PRIVATE_538_MARKER");
	const leaderEmail = (
		await prisma.contacts.findUniqueOrThrow({
			where: { id: leader.contact_id! },
		})
	).email!;
	await prisma.cohort_enrollments.create({
		data: {
			cohort_id: cohort.id,
			user_id: leader.id,
			email: leaderEmail,
			status: "joined",
			role: "owner",
			joined_at: new Date(),
		},
	});
	await expect(
		prisma.cohort_enrollments.create({
			data: {
				cohort_id: cohort.id,
				user_id: leader.id,
				email: `extra-${run}@fixture.example.test`,
				status: "joined",
				role: "member",
				joined_at: new Date(),
			},
		}),
	).rejects.toMatchObject({ code: "P2002" });
	const managerPractice = await prisma.practices.create({
		data: {
			user_id: leader.id,
			cohort_id: cohort.id,
			title: "538 manager fixture",
			status: "active",
			start_date: new Date(),
			end_date: new Date(Date.now() + 86400000 * 7),
			duration_days: 7,
			frequency_min_days: 1,
			frequency_max_days: 7,
			privacy_status: "private",
			visibility: "private",
		},
	});
	res = recorded(
		"manager-checkin",
		await request(server)
			.post(`/api/v1/practices/${managerPractice.external_id}/checkins`)
			.auth(token(leader.id), { type: "bearer" })
			.send({
				tags: ["閱讀"],
				mood: "happy",
				note: "PRIVATE_538_MANAGER",
				imageUrls: [],
			}),
	);
	expect(res.status).toBe(201);
	const managerCheckin = await prisma.practice_checkins.findFirstOrThrow({
		where: { practice_id: managerPractice.id },
	});
	const proofs = await prisma.$queryRaw<
		Array<{ new_value: { role: string } }>
	>`SELECT new_value FROM audit_logs WHERE action_type=${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_PARTICIPATED} AND target_id=${String(managerCheckin.id)}`;
	expect(proofs).toHaveLength(1);
	expect(proofs[0].new_value.role).toBe("owner");
	const exported = await exportBlogActivationEvidence(prisma, {
		registeredSince: new Date(Date.now() - 86400000).toISOString(),
		instrumentedSince: new Date(Date.now() - 86400000).toISOString(),
		asOf: new Date().toISOString(),
	});
	console.log("HTTP_ACTIVATION_EXPORT_READBACK", JSON.stringify(exported));
 if(qaDirectory){
  const root=path.resolve(__dirname,'../../..');
  const output=path.join(qaDirectory,'export.json');await fs.rm(output,{force:true});
  execFileSync(process.execPath,['-r','ts-node/register/transpile-only',path.join(root,'scripts/export-blog-activation.ts'),'--registered-since',new Date(Date.now()-86400000).toISOString(),'--as-of',new Date().toISOString(),'--instrumented-since',new Date(Date.now()-86400000).toISOString(),'--output',output],{cwd:root,env:{...process.env,BLOG_ACTIVATION_EXPORT_DATABASE_URL:process.env.DATABASE_URL,BLOG_ACTIVATION_EVIDENCE_ROOT:qaDirectory},stdio:'pipe',timeout:30000});
  const cli=JSON.parse(await fs.readFile(output,'utf8'));
  expect(cli.input.registrations.find((row:{leaderId:string})=>row.leaderId===String(leader.id))).toMatchObject({source:'blog',sourceContext:{contextId:blogContext.contextId}});
  await fs.writeFile(path.join(qaDirectory,'export-ready.json'),JSON.stringify({privateExport:'export.json',contextId:blogContext.contextId,source:'blog',actualOperations:'published_invited_nonleader_participated',fixtureProtocolRelease:JSON.parse(readFileSync(path.join(__dirname,'fixtures/blog-source/blog-release.json'),'utf8')).id}),{mode:0o600});
 }

 expect(exported.input.registrations.find(row=>row.leaderId===String(leader.id))).toMatchObject({source:'blog',sourceContext:{contextId:blogContext.contextId,confidence:'browser_reported',first:blogContext.first,lastAssist:blogContext.lastAssist}});
	const evidence = exported.input.events.filter(
		(e) => e.cohortId === String(cohort.id),
	);
	expect(evidence.map((e) => e.kind)).toEqual(
		expect.arrayContaining(["published", "invited", "joined", "participated"]),
	);
	expect(JSON.stringify(exported)).not.toMatch(
		/PRIVATE_538_MARKER|PRIVATE_538_MANAGER|fixture\.example\.test|invite_token/,
	);
	expect(
		evidence.find(
			(e) => e.kind === "participated" && e.participantId === String(leader.id),
		),
	).toMatchObject({ role: "owner", isManager: true });
	expect(
		evidence.find(
			(e) => e.kind === "participated" && e.participantId === String(member.id),
		),
	).toMatchObject({ role: "member", isManager: false });
	const joinEvidence = evidence.find((e) => e.kind === "joined");
	expect(joinEvidence).toMatchObject({
		participantId: String(member.id),
		role: "member",
		isManager: false,
	});
	const auditCount = async (action: string) =>
		Number(
			(
				await prisma.$queryRaw<
					Array<{ count: bigint }>
				>`SELECT COUNT(*) AS count FROM audit_logs WHERE action_type=${action} AND (target_id=${String(cohort.id)} OR new_value->>'cohortId'=${String(cohort.id)})`
			)[0].count,
		);
	const count = await auditCount(LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED);
	expect(count).toBe(1);
	await request(server)
		.patch(endpoint)
		.auth(token(leader.id), { type: "bearer" })
		.send({ status: "published" })
		.expect(200);
	expect(await auditCount(LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED)).toBe(
		count,
	);
});

it("attributes an actual publication transition from the locked transaction state during concurrent edits", async () => {
	const leader = await account("race-leader");
	const org = await prisma.organization.create({
		data: { name: `538-race-${run}`, status: "active" },
	});
	await prisma.organization_members.create({
		data: { organization_id: org.id, user_id: leader.id, role: "owner" },
	});
	const program = await prisma.programs.create({
		data: { organization_id: org.id, name: "538 race", kind: "lighthouse" },
	});
	const cohort = await prisma.cohorts.create({
		data: {
			program_id: program.id,
			slug: "race",
			display_name: "538 race",
			start_date: new Date("2026-01-01"),
			end_date: new Date("2099-12-31"),
			status: "published",
		},
	});
	const endpoint = `/api/v1/lighthouse/programs/${program.id}/cohorts/${cohort.id}`;
	let ready!: () => void;
	let release!: () => void;
	const read = new Promise<void>((resolve) => {
		ready = resolve;
	});
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	let held = false;
	const original = prisma.cohorts.findFirst.bind(prisma.cohorts);
	const spy = jest
		.spyOn(prisma.cohorts, "findFirst")
		.mockImplementation((args: any) => {
			if (
				args?.where?.id === cohort.id &&
				args?.select?.cohort_sessions &&
				!held
			) {
				held = true;
				return original(args).then(async (row) => {
					ready();
					await gate;
					return row;
				}) as any;
			}
			return original(args) as any;
		});
	try {
		const first = request(server)
			.patch(endpoint)
			.auth(token(leader.id), { type: "bearer" })
			.send({ status: "published" })
			.then((response) => response);
		await read;
		const draft = await request(server)
			.patch(endpoint)
			.auth(token(leader.id), { type: "bearer" })
			.send({ status: "draft" });
		expect(draft.status).toBe(200);
		release();
		expect((await first).status).toBe(200);
		const rows = await prisma.$queryRaw<
			Array<{ count: bigint }>
		>`SELECT COUNT(*) AS count FROM audit_logs WHERE action_type=${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED} AND target_id=${String(cohort.id)}`;
		expect(Number(rows[0].count)).toBe(1);
	} finally {
		release();
		spy.mockRestore();
	}
});

it("preserves base availability denial after capacity or deadline without rewriting the prior join", async () => {
	const member = await account("public-retry");
	const org = await prisma.organization.create({
		data: { name: `538-public-${run}`, status: "active" },
	});
	const program = await prisma.programs.create({
		data: { organization_id: org.id, name: "538 public", kind: "lighthouse" },
	});
	const cohort = await prisma.cohorts.create({
		data: {
			program_id: program.id,
			slug: "public-retry",
			display_name: "538 public",
			start_date: new Date("2026-01-01"),
			end_date: new Date("2099-12-31"),
			capacity: 1,
			status: "published",
		},
	});
	const endpoint = `/api/v1/cohorts/join/${cohort.join_token}`;
	expect(
		(
			await request(server)
				.post(endpoint)
				.auth(token(member.id), { type: "bearer" })
				.send({ consent: true })
		).status,
	).toBe(201);
	const before = await prisma.cohort_enrollments.findFirstOrThrow({
		where: { cohort_id: cohort.id, user_id: member.id },
	});
	expect(
		(
			await request(server)
				.post(endpoint)
				.auth(token(member.id), { type: "bearer" })
				.send({ consent: true })
		).status,
	).toBe(409);
	await prisma.cohorts.update({
		where: { id: cohort.id },
		data: { join_deadline: new Date("2026-01-01") },
	});
	expect(
		(
			await request(server)
				.post(endpoint)
				.auth(token(member.id), { type: "bearer" })
				.send({ consent: true })
		).status,
	).toBe(409);
	expect(
		(
			await prisma.cohort_enrollments.findUniqueOrThrow({
				where: { id: before.id },
			})
		).joined_at,
	).toEqual(before.joined_at);
	const audits = await prisma.$queryRaw<
		Array<{ count: bigint }>
	>`SELECT COUNT(*) AS count FROM audit_logs WHERE action_type=${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_ACTIVATION_JOINED} AND target_id=${String(before.id)}`;
	expect(Number(audits[0].count)).toBe(1);
});

it("keeps one operator snapshot when an older writer commits during the export", async () => {
	const leader = await account("snapshot-leader");
	const org = await prisma.organization.create({
		data: { name: `538-snapshot-${run}`, status: "active" },
	});
	await prisma.organization_members.create({
		data: { organization_id: org.id, user_id: leader.id, role: "owner" },
	});
	const program = await prisma.programs.create({
		data: { organization_id: org.id, name: "538 snapshot", kind: "lighthouse" },
	});
	const cohort = await prisma.cohorts.create({
		data: {
			program_id: program.id,
			slug: "snapshot",
			display_name: "538 snapshot",
			start_date: new Date("2026-01-01"),
			end_date: new Date("2099-12-31"),
			status: "published",
		},
	});
	let writerReady!: () => void,
		commitWriter!: () => void,
		readerReady!: () => void,
		continueReader!: () => void;
	const inserted = new Promise<void>((r) => (writerReady = r)),
		commitGate = new Promise<void>((r) => (commitWriter = r)),
		firstRead = new Promise<void>((r) => (readerReady = r)),
		readGate = new Promise<void>((r) => (continueReader = r));
	// Control event time independently of PG microsecond NOW vs JS millisecond observation.
	const observedEventTime = new Date(Date.now() - 1000);
	const writer = prisma.$transaction(async (tx) => {
		await tx.$executeRaw`INSERT INTO audit_logs(admin_id,action_type,target_resource,target_id,new_value,created_at) VALUES(${leader.id},${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED},'cohort',${String(cohort.id)},'{}'::jsonb,${observedEventTime})`;
		writerReady();
		await commitGate;
	});
	await inserted;
	let held = false;
	const observe = (db: any) =>
		new Proxy(db, {
			get(target, key) {
				if (key === "$queryRaw")
					return async (...args: any[]) => {
						const result = await Reflect.apply(target.$queryRaw, target, args);
						if (!held) {
							held = true;
							readerReady();
							await readGate;
						}
						return result;
					};
				const value = Reflect.get(target, key);
				return typeof value === "function" ? value.bind(target) : value;
			},
		});
	const client = {
		$queryRaw: observe(prisma).$queryRaw,
		$transaction: (callback: any, options: any) =>
			prisma.$transaction(async (tx) => callback(observe(tx)), options),
	};
	try {
		const options = {
			registeredSince: new Date(Date.now() - 86400000).toISOString(),
			instrumentedSince: new Date(Date.now() - 86400000).toISOString(),
			asOf: new Date().toISOString(),
		};
		const pending = exportBlogActivationEvidence(client, options);
		await firstRead;
		commitWriter();
		await writer;
		continueReader();
		const during = await pending;
		expect(
			during.input.events.some((e) => e.cohortId === String(cohort.id)),
		).toBe(false);
		const after = await exportBlogActivationEvidence(prisma, options);
		expect(
			after.input.events.some((e) => e.cohortId === String(cohort.id)),
		).toBe(true);
		expect(after.provenance).toMatchObject({
			readConsistency: "repeatable_read",
			cutoffSemantics:
				"event_timestamps_in_current_snapshot_not_historical_commit_state",
		});
	} finally {
		commitWriter();
		continueReader();
		await writer;
	}
});

it('keeps invalid/config-missing sources unknown, rejects existing-user registration, and unlinks canonical FK on account deletion', async()=> {
 const invalid = await registeredAccount('invalid-context','{"email":"DO_NOT_STORE_PRIVATE@example.invalid"}');
 const ctx=sourceContext();const previous=process.env.BLOG_SOURCE_CONTEXT_TTL_SECONDS;delete process.env.BLOG_SOURCE_CONTEXT_TTL_SECONDS;
 let missing;try { missing=await registeredAccount('missing-config',JSON.stringify(ctx)); } finally {process.env.BLOG_SOURCE_CONTEXT_TTL_SECONDS=previous;}
 const bound=await registeredAccount('bound-context',JSON.stringify(ctx));
 const duplicate=await registeredAccount('duplicate-context',JSON.stringify(ctx));
 const rows=await prisma.$queryRaw<Array<{admin_id:number|null,new_value:unknown,target_id:string}>>`SELECT admin_id,new_value,target_id FROM audit_logs WHERE action_type=${BLOG_REGISTRATION_SOURCE_ACTION}`;
 expect(rows.filter(row=>[invalid.id,missing!.id,duplicate.id].includes(row.admin_id!))).toHaveLength(0);
 const claimed=rows.filter(row=>row.target_id===ctx.contextId);expect(claimed).toHaveLength(1);expect(claimed[0].admin_id).toBe(bound.id);
 expect(JSON.stringify(rows)).not.toContain('DO_NOT_STORE_PRIVATE');expect(JSON.stringify(claimed[0].new_value)).not.toMatch(/userId|leaderId|email|name/);
 const existing=await request(server).post('/api/v1/users/me').set('Authorization',`Bearer ${token(bound.id)}`).set('X-Daodao-Blog-Context',JSON.stringify(sourceContext())).send({name:'existing-user',customId:'existinguser',isSendEmail:false});
 expect(existing.status).toBe(404);
 const deleteToken=jwt.sign({id:bound.id,_id:bound.external_id || '',isTemp:false},process.env.JWT_SECRET!,{expiresIn:'1h'});
 const deleted=await request(server).delete('/api/v1/users/me').set('Authorization',`Bearer ${deleteToken}`);
 expect(deleted.status).toBe(200);
 const after=await prisma.$queryRaw<Array<{admin_id:number|null}>>`SELECT admin_id FROM audit_logs WHERE action_type=${BLOG_REGISTRATION_SOURCE_ACTION} AND target_id=${ctx.contextId}`;
 expect(after).toEqual([{admin_id:null}]);
 const afterDelete=await registeredAccount('after-delete',JSON.stringify(ctx));
 const rebound=await prisma.$queryRaw<Array<{admin_id:number|null}>>`SELECT admin_id FROM audit_logs WHERE action_type=${BLOG_REGISTRATION_SOURCE_ACTION} AND target_id=${ctx.contextId}`;
 expect(rebound).toEqual([{admin_id:null}]);expect(afterDelete.id).not.toBe(bound.id);
 const preflight=await request(server).options('/api/v1/users/me').set('Origin','https://app.daodao.so').set('Access-Control-Request-Method','POST').set('Access-Control-Request-Headers','x-daodao-blog-context');
 expect(preflight.status).toBe(204);expect(preflight.headers['access-control-allow-headers']).toContain('x-daodao-blog-context');
});

it('serializes simultaneous registration context claims and rolls source evidence back with the business transaction', async()=>{
 const ctx=sourceContext();
 const actors=await Promise.all([registeredAccount('concurrent-one',JSON.stringify(ctx)),registeredAccount('concurrent-two',JSON.stringify(ctx))]);
 const claimed=await prisma.$queryRaw<Array<{admin_id:number|null}>>`SELECT admin_id FROM audit_logs WHERE action_type=${BLOG_REGISTRATION_SOURCE_ACTION} AND target_id=${ctx.contextId}`;
 expect(claimed).toHaveLength(1);expect(actors.map(actor=>actor.id)).toContain(claimed[0].admin_id);
 const rollback=sourceContext();const prepared=await prepareBlogRegistrationSource(JSON.stringify(rollback));expect(prepared).not.toBeNull();
 await expect(prisma.$transaction(async(tx)=>{await recordBlogRegistrationSource(tx,actors[0],prepared);throw new Error('fixture-business-rollback');})).rejects.toThrow('fixture-business-rollback');
 const absent=await prisma.$queryRaw<Array<{id:bigint}>>`SELECT id FROM audit_logs WHERE action_type=${BLOG_REGISTRATION_SOURCE_ACTION} AND target_id=${rollback.contextId}`;
 expect(absent).toHaveLength(0);
});

it('refuses a CLI output outside the operator approved evidence root before writing private export', async () => {
 const owned=await fs.mkdtemp(path.join(tmpdir(),'daodao538-cli-boundary-'));
 const approved=path.join(owned,'approved');const outside=path.join(owned,'outside');await fs.mkdir(approved,{mode:0o700});await fs.mkdir(outside,{mode:0o700});
 const output=path.join(outside,'export.json');const root=path.resolve(__dirname,'../../..');
 try {
  let rejected=false;
  try {execFileSync(process.execPath,['-r','ts-node/register/transpile-only',path.join(root,'scripts/export-blog-activation.ts'),'--registered-since',new Date(Date.now()-86400000).toISOString(),'--as-of',new Date().toISOString(),'--instrumented-since',new Date(Date.now()-86400000).toISOString(),'--output',output],{cwd:root,env:{...process.env,BLOG_ACTIVATION_EVIDENCE_ROOT:approved,BLOG_ACTIVATION_EXPORT_DATABASE_URL:process.env.DATABASE_URL},stdio:'pipe',timeout:30000});}catch{rejected=true;}
  expect(rejected).toBe(true);await expect(fs.stat(output)).rejects.toMatchObject({code:'ENOENT'});
  const allowed=path.join(approved,'export.json');
  const args=['-r','ts-node/register/transpile-only',path.join(root,'scripts/export-blog-activation.ts'),'--registered-since',new Date(Date.now()-86400000).toISOString(),'--as-of',new Date().toISOString(),'--instrumented-since',new Date(Date.now()-86400000).toISOString(),'--output',allowed];
  const options={cwd:root,env:{...process.env,BLOG_ACTIVATION_EVIDENCE_ROOT:approved,BLOG_ACTIVATION_EXPORT_DATABASE_URL:process.env.DATABASE_URL},stdio:'pipe' as const,timeout:30000};
  execFileSync(process.execPath,args,options);const bytes=await fs.readFile(allowed);expect((await fs.stat(allowed)).mode & 0o777).toBe(0o600);expect(JSON.parse(bytes.toString()).input.evidenceMode).toBe('observed');
  expect(()=>execFileSync(process.execPath,args,options)).toThrow();expect(await fs.readFile(allowed)).toEqual(bytes);
 } finally {await fs.rm(owned,{recursive:true,force:true});}
});
