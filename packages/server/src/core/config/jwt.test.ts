import { describe, it, expect, beforeAll } from 'vitest';
import { signAccessToken, signRefreshToken, verifyToken, verifyRefreshToken } from './jwt.js';

describe('JWT Utility tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_access_secret_123456';
    process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_123456';
  });

  const mockUser = {
    id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'avatar_url_here',
  };

  it('should sign and verify access token correctly', () => {
    const token = signAccessToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.name).toBe(mockUser.name);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.avatar).toBe(mockUser.avatar);
  });

  it('should sign and verify refresh token correctly', () => {
    const token = signRefreshToken(mockUser.id);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe(mockUser.id);
  });

  it('should throw an error for an invalid token', () => {
    expect(() => verifyToken('invalid_token_string')).toThrow();
    expect(() => verifyRefreshToken('invalid_token_string')).toThrow();
  });
});
