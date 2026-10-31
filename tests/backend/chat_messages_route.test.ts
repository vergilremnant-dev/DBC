import { describe, it, expect, vi, beforeAll } from 'vitest';

// In-memory database shared by the mocked db module (test data only).
const h = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../api-lib/utils/db.js', async () => {
  const { createFakePrisma } = await import('./helpers/fakePrisma.js');
  h.db = createFakePrisma();
  return { db: h.db };
});
// Route handlers read the caller from the request instead of a signed JWT.
vi.mock('../../api-lib/utils/auth.js', () => ({ verifyToken: (req: any) => req.__user ?? null }));

import messagesRoute from '../../api-lib/routes/chat/messages/[conversationId].js';
import conversationDetailRoute from '../../api-lib/routes/chat/conversations/[id].js';
import conversationsRoute from '../../api-lib/routes/chat/conversations/index.js';
import { db } from '../../api-lib/utils/db.js';

const U = {
  cust: { id: 'u-cust', role: 'CUSTOMER' },
  pro: { id: 'u-pro', role: 'PROVIDER' },
  outsiderCust: { id: 'u-out-c', role: 'CUSTOMER' },
  outsiderPro: { id: 'u-out-p', role: 'PROVIDER' },
};

async function call(handler: any, user: any, opts: { method?: string; query?: any } = {}) {
  let status = 200;
  let body: any;
  const res: any = { status: (s: number) => ((status = s), res), json: (b: any) => ((body = b), res), setHeader: () => res };
  await handler({ method: opts.method ?? 'GET', query: opts.query ?? {}, body: {}, headers: {}, __user: user }, res);
  return { status, body };
}

const keysDeep = (v: unknown): string[] => (v && typeof v === 'object' ? Object.entries(v as object).flatMap(([k, x]) => [k, ...keysDeep(x)]) : []);
const PRIVATE_KEYS = ['email', 'password', 'firebaseUid', 'phoneE164', 'phoneNumber', 'address', 'pincode'];

beforeAll(async () => {
  for (const [k, u] of Object.entries(U)) {
    await db.user.create({ data: { id: u.id, role: u.role, email: `${k}@example.test`, password: 'hash', firebaseUid: `fb-${k}`, phoneE164: `+9100000000${k.length}` } });
  }
  await db.customerProfile.create({ data: { id: 'cp-1', userId: U.cust.id, fullName: 'Test Customer', phoneNumber: '9000000001', address: '1 Test Street', city: 'Hyderabad', state: 'TS', pincode: '500001' } });
  await db.customerProfile.create({ data: { id: 'cp-2', userId: U.outsiderCust.id, fullName: 'Other Customer', phoneNumber: '9000000002', city: 'Pune', state: 'MH', pincode: '411001' } });
  await db.providerProfile.create({ data: { id: 'pp-1', userId: U.pro.id, fullName: 'Test Pro', businessName: 'Test Works', email: 'pro@example.test', phoneNumber: '9000000003', city: 'Hyderabad', state: 'TS', categoryId: 1, experienceYears: 3 } });
  await db.providerProfile.create({ data: { id: 'pp-2', userId: U.outsiderPro.id, fullName: 'Other Pro', email: 'op@example.test', phoneNumber: '9000000004', city: 'Hyderabad', state: 'TS', categoryId: 1, experienceYears: 1 } });
  await db.conversation.create({ data: { id: 'conv-1', customerId: 'cp-1', providerId: 'pp-1', conversationType: 'REQUIREMENT' } });
  await db.message.create({ data: { id: 'm-1', conversationId: 'conv-1', senderId: U.pro.id, content: 'Hello', messageType: 'TEXT', isRead: false, createdAt: new Date('2026-01-01T10:00:00Z') } });
  await db.message.create({ data: { id: 'm-2', conversationId: 'conv-1', senderId: U.cust.id, content: 'Hi', messageType: 'TEXT', isRead: false, createdAt: new Date('2026-01-01T11:00:00Z') } });
});

describe('GET /api/chat/messages/:conversationId', () => {
  it('rejects unauthenticated requests', async () => {
    expect((await call(messagesRoute, null, { query: { conversationId: 'conv-1' } })).status).toBe(401);
  });

  it('rejects missing or malformed conversation ids', async () => {
    expect((await call(messagesRoute, U.cust, { query: {} })).status).toBe(400);
    expect((await call(messagesRoute, U.cust, { query: { conversationId: "conv-1' OR 1=1" } })).status).toBe(400);
    expect((await call(messagesRoute, U.cust, { query: { conversationId: 'x'.repeat(65) } })).status).toBe(400);
  });

  it('only allows GET', async () => {
    expect((await call(messagesRoute, U.cust, { method: 'POST', query: { conversationId: 'conv-1' } })).status).toBe(405);
  });

  it('returns 404 for a conversation that does not exist', async () => {
    const r = await call(messagesRoute, U.cust, { query: { conversationId: 'does-not-exist' } });
    expect(r.status).toBe(404);
    expect(r.body.success).toBe(false);
  });

  it('refuses customers and professionals who are not participants, without marking anything read', async () => {
    for (const u of [U.outsiderCust, U.outsiderPro]) {
      const r = await call(messagesRoute, u, { query: { conversationId: 'conv-1' } });
      expect(r.status).toBe(403);
      expect(r.body.data).toBeUndefined();
    }
    expect(h.db._tables.message.every((m: any) => m.isRead === false)).toBe(true);
  });

  it('returns messages oldest first to the customer and marks only incoming messages read', async () => {
    const r = await call(messagesRoute, U.cust, { query: { conversationId: 'conv-1' } });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.data.map((m: any) => m.id)).toEqual(['m-1', 'm-2']);
    const rows = Object.fromEntries(h.db._tables.message.map((m: any) => [m.id, m.isRead]));
    expect(rows).toEqual({ 'm-1': true, 'm-2': false });
  });

  it('lets the professional participant read the thread', async () => {
    const r = await call(messagesRoute, U.pro, { query: { conversationId: 'conv-1' } });
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(2);
  });

  it("never exposes the sender's email, phone or Firebase id", async () => {
    const r = await call(messagesRoute, U.pro, { query: { conversationId: 'conv-1' } });
    expect(r.body.data[0].sender).toEqual({ id: U.pro.id, role: 'PROVIDER' });
    for (const k of PRIVATE_KEYS) expect(keysDeep(r.body.data)).not.toContain(k);
  });
});

describe('Conversation reads expose display fields only', () => {
  it("conversation detail hides the other party's phone, email and address", async () => {
    const r = await call(conversationDetailRoute, U.pro, { query: { id: 'conv-1' } });
    expect(r.status).toBe(200);
    expect(r.body.data.customer.fullName).toBe('Test Customer');
    expect(r.body.data.provider.businessName).toBe('Test Works');
    for (const k of PRIVATE_KEYS) expect(keysDeep(r.body.data)).not.toContain(k);
  });

  it('conversation detail is refused to non-participants', async () => {
    expect((await call(conversationDetailRoute, U.outsiderPro, { query: { id: 'conv-1' } })).status).toBe(403);
  });

  it('conversation list hides private contact fields', async () => {
    const r = await call(conversationsRoute, U.cust);
    expect(r.status).toBe(200);
    expect(r.body.data.map((c: any) => c.id)).toEqual(['conv-1']);
    for (const k of PRIVATE_KEYS) expect(keysDeep(r.body.data)).not.toContain(k);
  });
});
