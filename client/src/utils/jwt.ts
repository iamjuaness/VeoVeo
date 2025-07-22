import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(user: { id: string; name: string; email: string; avatar: string }) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export interface AuthPayload {
  id: string;
  name: string;
  email: string;
  iat: number;
  exp: number;
}

export function getUserFromToken(token: string): AuthPayload | null {
  try {
    return jwtDecode<AuthPayload>(token);
  } catch {
    return null;
  }
}
function jwtDecode<T>(token: string): AuthPayload | null {
  throw new Error('Function not implemented.');
}

