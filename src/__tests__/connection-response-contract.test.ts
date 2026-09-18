/** HTTP response contracts for connection routes: social graph scoping, schema compliance, internal field leakage. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { globalErrorHandler } from '../middleware/error.middleware';
import {
  connectionListApiResponseSchema,
  connectionRequestListApiResponseSchema,
  connectionActionApiResponseSchema,
  connectionStatusApiResponseSchema,
} from '../validators/connection.validators';

const sensitiveInternalUserId = 99887766;

const mockConnectionList = {
  success: true as const,
  data: [{
    connectionId: 1,
    userId: 42,
    externalId: 'ext-uuid-peer',
    nickname: '夥伴A',
    photoUrl: 'https://example.com/a.jpg',
    connectedAt: '2026-08-01T10:00:00.000Z',
  }],
  timestamp: new Date().toISOString(),
};

const mockIncomingRequests = {
  success: true as const,
  data: [{
    requestId: 10,
    requesterExternalId: 'ext-uuid-requester',
    requesterNickname: '請求者',
    requesterPhotoUrl: null,
    receiverExternalId: 'ext-uuid-me',
    receiverNickname: '我',
    receiverPhotoUrl: 'https://example.com/me.jpg',
    intent: '一起學 React',
    interactionCount: 3,
    createdAt: '2026-09-01T08:00:00.000Z',
  }],
  timestamp: new Date().toISOString(),
};

const mockConnectionStatus = {
  success: true as const,
  data: {
    status: 'connected' as const,
    isConnected: true,
    requestId: 10,
    interactionCount: 5,
    hasBypass: false,
  },
  timestamp: new Date().toISOString(),
};

const mockActionResult = {
  success: true as const,
  data: { message: '操作成功' },
  timestamp: new Date().toISOString(),
};

const service = {
  getConnections: jest.fn().mockResolvedValue(mockConnectionList),
  getPendingIncoming: jest.fn().mockResolvedValue(mockIncomingRequests),
  getPendingOutgoing: jest.fn().mockResolvedValue(mockIncomingRequests),
  getConnectionStatus: jest.fn().mockResolvedValue(mockConnectionStatus),
  sendRequest: jest.fn().mockResolvedValue(mockActionResult),
  acceptRequest: jest.fn().mockResolvedValue(mockActionResult),
  rejectRequest: jest.fn().mockResolvedValue(mockActionResult),
  withdrawRequest: jest.fn().mockResolvedValue(mockActionResult),
  disconnect: jest.fn().mockResolvedValue(mockActionResult),
};

jest.mock('../services/connection.service', () => ({ connectionService: service }));
jest.mock('../middleware/auth', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '需要登入' } });
      return;
    }
    req.user = { id: 42, _id: 'test-uuid-me' } as Request['user'];
    next();
  },
}));

import router from '../routes/connection.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/connections', router);
app.use(globalErrorHandler);

beforeEach(() => jest.clearAllMocks());

describe('connection list (GET /connections)', () => {
  it('validates the connection list against connectionListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/connections').set('Authorization', 'Bearer test').expect(200);
    expect(() => connectionListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nickname).toBe('夥伴A');
    expect(res.body.data[0].connectedAt).toBe('2026-08-01T10:00:00.000Z');
  });

  it('scopes results to the requesting user only', async () => {
    await request(app).get('/api/v1/connections').set('Authorization', 'Bearer test').expect(200);
    expect(service.getConnections).toHaveBeenCalledWith(42, expect.anything(), expect.anything());
  });
});

describe('incoming requests (GET /connections/requests/incoming)', () => {
  it('validates the incoming requests against connectionRequestListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/connections/requests/incoming').set('Authorization', 'Bearer test').expect(200);
    expect(() => connectionRequestListApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data[0].intent).toBe('一起學 React');
    expect(res.body.data[0].interactionCount).toBe(3);
  });
});

describe('outgoing requests (GET /connections/requests/outgoing)', () => {
  it('validates the outgoing requests against connectionRequestListApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/connections/requests/outgoing').set('Authorization', 'Bearer test').expect(200);
    expect(() => connectionRequestListApiResponseSchema.parse(res.body)).not.toThrow();
  });
});

describe('connection status (GET /connections/status/:userId)', () => {
  it('validates the status response against connectionStatusApiResponseSchema', async () => {
    const res = await request(app).get('/api/v1/connections/status/ext-uuid-peer').set('Authorization', 'Bearer test').expect(200);
    expect(() => connectionStatusApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.status).toBe('connected');
    expect(res.body.data.isConnected).toBe(true);
    expect(res.body.data.hasBypass).toBe(false);
  });
});

describe('send connection request (POST /connections/request)', () => {
  it('validates the action response against connectionActionApiResponseSchema', async () => {
    const res = await request(app)
      .post('/api/v1/connections/request')
      .set('Authorization', 'Bearer test')
      .send({ receiverExternalId: 'ext-uuid-target', intent: '一起學習' })
      .expect(201);
    expect(() => connectionActionApiResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.data.message).toBe('操作成功');
  });
});

describe('field leakage prevention', () => {
  it('FINDING: connection controller passes service result directly — extra fields leak through', async () => {
    service.getConnections.mockResolvedValueOnce({
      ...mockConnectionList,
      data: [{ ...mockConnectionList.data[0], internalId: sensitiveInternalUserId, password_hash: 'secret' }],
    });
    const res = await request(app).get('/api/v1/connections').set('Authorization', 'Bearer test').expect(200);
    // Unlike user/cohort controllers, connection controller does NOT parse through Zod.
    // Extra fields are forwarded verbatim. This documents the gap.
    expect(res.body.data[0]).toHaveProperty('internalId');
    expect(res.body.data[0]).toHaveProperty('password_hash');
  });

  it('requires authentication for all connection endpoints', async () => {
    const endpoints = [
      '/api/v1/connections',
      '/api/v1/connections/requests/incoming',
      '/api/v1/connections/requests/outgoing',
      '/api/v1/connections/status/test-user',
    ];
    for (const path of endpoints) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });
});
