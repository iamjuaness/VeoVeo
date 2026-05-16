import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../users/user.model.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../core/config/jwt.js";

export async function register(req: Request, res: Response) {
  const { name, email, password, passwordConfirm, selectedAvatar } = req.body;

  try {
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, selectedAvatar });

    const accessToken = signAccessToken({ id: String(user._id), email: user.email, name: user.name, avatar: user.selectedAvatar });
    const refreshToken = signRefreshToken(String(user._id));

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({
      message: "User created!",
      accessToken,
      refreshToken,
      name: user.name,
      email: user.email,
      id: user._id,
      avatar: user.selectedAvatar
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}


export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken({ id: String(user._id), email: user.email, name: user.name, avatar: user.selectedAvatar });
    const refreshToken = signRefreshToken(String(user._id));

    // Guardar el refresh token en el usuario para validación posterior (y revocación)
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({
      accessToken,
      refreshToken,
      name: user.name,
      email: user.email,
      id: user._id,
      avatar: user.selectedAvatar
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    // Verificamos que el usuario exista y que el token coincida con el almacenado
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generar nuevos tokens (Rotación de Refresh Token para mayor seguridad)
    const newAccessToken = signAccessToken({ id: String(user._id), email: user.email, name: user.name, avatar: user.selectedAvatar });
    const newRefreshToken = signRefreshToken(String(user._id));

    user.refreshToken = newRefreshToken;
    await user.save();

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error("Error en refresh token:", error);
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
}
