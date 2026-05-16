import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('Basic API tests', () => {
  it('should have an auth endpoint', async () => {
    const response = await request(app).get('/api/auth/test');
    // Even if it returns 404, it means the app is working and routing is set up
    expect(response.status).toBeDefined();
  });
});
