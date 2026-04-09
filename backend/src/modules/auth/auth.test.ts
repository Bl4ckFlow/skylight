import { describe, it, expect, vi } from 'vitest';
import { pool } from '../../config/db';
import * as authService from './auth.service';

vi.mock('../../config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('Auth Service', () => {
  it('login success', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [{
        id: '1', company_id: '1', email: 'test@test.com', password_hash: '$2b$10$...', role: 'Admin'
      }]
    });
    
    // Mock bcrypt
    vi.doMock('bcryptjs', () => ({
      compare: vi.fn(() => Promise.resolve(true)),
    }));

    const result = await authService.loginUser('test@test.com', 'pass');
    expect(result).toBeDefined();
  });
});

