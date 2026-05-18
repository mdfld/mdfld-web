import { GET } from './route';

describe('GET /api/meta/salesCount', () => {
  it('returns salesCount as a number', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.salesCount).toBe('number');
  });
});
