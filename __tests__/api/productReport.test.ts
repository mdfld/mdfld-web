import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock auth before importing route
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@prisma/client', () => {
  function PrismaClient() {
    return {
      $transaction: vi.fn(),
      product: { update: vi.fn() },
      fraudReport: { create: vi.fn() },
    };
  }
  return { PrismaClient };
});

vi.mock('resend', () => {
  function Resend() {
    return { emails: { send: vi.fn().mockResolvedValue({}) } };
  }
  return { Resend };
});

import { POST } from '../../app/api/products/[id]/report/route';
import { NextRequest } from 'next/server';

describe('POST /api/products/[id]/report', () => {
  it('returns 401 when not authenticated', async () => {
    const req = new NextRequest('http://localhost/api/products/test123/report', {
      method: 'POST',
      body: JSON.stringify({ reason: 'fake product' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'test123' }) });
    expect(res.status).toBe(401);
  });
});
