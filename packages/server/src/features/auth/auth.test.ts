import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import User from '../users/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock User model
vi.mock('../users/user.model.js', () => {
  const mockUserInstance = {
    _id: 'mock_user_id_999',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed_password_123',
    selectedAvatar: 'avatar2',
    refreshToken: 'valid_refresh_token_xyz',
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  return {
    default: {
      findOne: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    },
    // If needed for instantiation
    User: vi.fn(),
  };
});

describe('Auth Controller Integration Tests', () => {
  const JWT_SECRET = 'test_secret_for_auth_integration_999';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          passwordConfirm: 'passwordXYZ',
          selectedAvatar: 'avatar2',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toBe("Passwords don't match");
    });

    it('should return 409 if email is already registered', async () => {
      // Mock existing user found
      vi.mocked(User.findOne).mockResolvedValueOnce({ email: 'jane@example.com' } as any);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
          selectedAvatar: 'avatar2',
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Email already registered' });
      expect(User.findOne).toHaveBeenCalledWith({ email: 'jane@example.com' });
    });

    it('should register a new user successfully', async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce(null);
      
      const mockSavedUser = {
        _id: 'mock_user_id_999',
        name: 'Jane Doe',
        email: 'jane@example.com',
        selectedAvatar: 'avatar2',
        refreshToken: '',
        save: vi.fn().mockResolvedValue(true),
      };
      
      vi.mocked(User.create).mockResolvedValueOnce(mockSavedUser as any);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
          selectedAvatar: 'avatar2',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.name).toBe('Jane Doe');
      expect(response.body.email).toBe('jane@example.com');
      expect(User.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 if user does not exist', async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return 401 if password check fails', async () => {
      const mockHashedPassword = await bcrypt.hash('real_password', 10);
      const mockUser = {
        _id: 'mock_user_id_999',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: mockHashedPassword,
        selectedAvatar: 'avatar2',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(User.findOne).mockResolvedValueOnce(mockUser as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'wrong_password',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should log in successfully with correct credentials', async () => {
      const mockHashedPassword = await bcrypt.hash('real_password', 10);
      const mockUser = {
        _id: 'mock_user_id_999',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: mockHashedPassword,
        selectedAvatar: 'avatar2',
        refreshToken: '',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(User.findOne).mockResolvedValueOnce(mockUser as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'real_password',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.name).toBe('Jane Doe');
      expect(response.body.email).toBe('jane@example.com');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 if refreshToken is not provided', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Refresh token is required' });
    });

    it('should return 403 if refresh token verification fails', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_expired_or_fake_token' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Invalid or expired refresh token' });
    });

    it('should return 403 if user is not found or refresh token mismatch', async () => {
      const tokenPayload = { id: 'mock_user_id_999' };
      const validToken = jwt.sign(tokenPayload, JWT_SECRET);

      // User not found in DB
      vi.mocked(User.findById).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validToken });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Invalid refresh token' });
    });

    it('should rotate tokens and return 200 on valid refresh token', async () => {
      const tokenPayload = { id: 'mock_user_id_999' };
      const validToken = jwt.sign(tokenPayload, JWT_SECRET);

      const mockUser = {
        _id: 'mock_user_id_999',
        name: 'Jane Doe',
        email: 'jane@example.com',
        selectedAvatar: 'avatar2',
        refreshToken: validToken,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
