import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { GET } from '../../app/api/auth/admin-check/route';
import { NextRequest } from 'next/server';

describe('GET /api/auth/admin-check', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it('returns 401 when no session', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/auth/admin-check');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.isAdmin).toBe(false);
  });

  it('returns isAdmin false for BUYER role', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'BUYER' } });
    const req = new NextRequest('http://localhost/api/auth/admin-check');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isAdmin).toBe(false);
  });

  it('returns isAdmin true for ADMIN role', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost/api/auth/admin-check');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isAdmin).toBe(true);
  });

  it('returns isAdmin true for SUPER_ADMIN role', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN' } });
    const req = new NextRequest('http://localhost/api/auth/admin-check');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isAdmin).toBe(true);
  });
});
