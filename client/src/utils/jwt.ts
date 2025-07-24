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
    { expiresIn: "1 week" }
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
