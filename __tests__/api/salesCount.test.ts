import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@prisma/client', () => {
  const mockCount = vi.fn().mockResolvedValue(42);
  function PrismaClient() {
    return { order: { count: mockCount } };
  }
  return { PrismaClient };
});

import { GET } from '../../app/api/meta/salesCount/route';

describe('GET /api/meta/salesCount', () => {
  it('returns salesCount as a number', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.salesCount).toBe('number');
    expect(body.salesCount).toBe(42);
  });
});
