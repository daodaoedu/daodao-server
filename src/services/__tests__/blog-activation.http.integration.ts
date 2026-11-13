// Fail closed before loading application modules outside the owned disposable runner.
require("../../../tests/integration/auth/__tests__/oauth-environment.cjs");
import "../../config/openapi-registry";
import express from "express";
import http from "node:http";
import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { prisma } from "../database/prisma.service";
import redis from "../database/redis.service";
import organizationRoutes from "../../routes/organization.routes";
import joinRoutes from "../../routes/cohort-join.routes";
import practiceRoutes from "../../routes/practice.routes";
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
app.use(express.json());
app.use("/api/v1/lighthouse", organizationRoutes);
app.use("/api/v1/cohorts", joinRoutes);
app.use("/api/v1/practices", practiceRoutes);
app.use(globalErrorHandler);
const server = http.createServer(app);
const run = randomUUID();
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
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
});
afterAll(async () => {
	console.log("HTTP_FIXTURE_READBACK", JSON.stringify(trace));
	await new Promise<void>((resolve, reject) =>
		server.close((e) => (e ? reject(e) : resolve())),
	);
	await prisma.$disconnect();
	redis.removeAllListeners("close");
	await redis.quit();
	await new Promise((resolve) => setImmediate(resolve));
});
it("executes publication, targeted invitation, join and checkin through real HTTP and isolates manager/member/outsider evidence", async () => {
	const leader = await account("leader"),
		member = await account("member"),
		outsider = await account("outsider");
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
	const writer = prisma.$transaction(async (tx) => {
		await tx.$executeRaw`INSERT INTO audit_logs(admin_id,action_type,target_resource,target_id,new_value) VALUES(${leader.id},${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_PUBLISHED},'cohort',${String(cohort.id)},'{}'::jsonb)`;
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
