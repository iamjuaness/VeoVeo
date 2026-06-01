import { describe, it, expect, vi, beforeAll } from 'vitest';
import { authMiddleware } from './authMiddleware.js';
import { validate } from './validate.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

describe('Middlewares tests', () => {
  const JWT_SECRET = 'test_jwt_secret_middleware_1234';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe('authMiddleware', () => {
    it('should return 401 if no Authorization header is provided', () => {
      const req = { headers: {} } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token prefix is not Bearer', () => {
      const req = { headers: { authorization: 'Basic token123' } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    });

    it('should return 401 if token is invalid or expired', () => {
      const req = { headers: { authorization: 'Bearer invalid_token' } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 401 if decoded payload has no user ID', () => {
      const token = jwt.sign({ name: 'No ID' }, JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('should call next and set req.id if token is valid', () => {
      const token = jwt.sign({ id: 'user_999' }, JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      authMiddleware(req, res, next);

      expect(req.id).toBe('user_999');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validate middleware', () => {
    const testSchema = z.object({
      body: z.object({
        email: z.string().email(),
        age: z.number().min(18),
      }),
    });

    it('should call next if request body matches schema', () => {
      const req = {
        body: {
          email: 'test@example.com',
          age: 25,
        },
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = vi.fn() as NextFunction;

      const validator = validate(testSchema as any);
      validator(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 with errors if request body does not match schema', () => {
      const req = {
        body: {
          email: 'not-an-email',
          age: 15,
        },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const validator = validate(testSchema as any);
      validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.any(Array),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
