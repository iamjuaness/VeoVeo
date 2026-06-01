import jwt from 'jsonwebtoken';

function getSecrets() {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_development_secret';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
  return { JWT_SECRET, JWT_REFRESH_SECRET };
}

export function signAccessToken(user: { id: string; name: string; email: string; avatar: string }) {
  const { JWT_SECRET } = getSecrets();
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
}

export function signRefreshToken(userId: string) {
  const { JWT_REFRESH_SECRET } = getSecrets();
  return jwt.sign(
    { id: userId },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  const { JWT_SECRET } = getSecrets();
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token: string): any {
  const { JWT_REFRESH_SECRET } = getSecrets();
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
