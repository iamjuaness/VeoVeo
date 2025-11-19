import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../users/user.model.js";
import { signToken } from "../../core/config/jwt.js";

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

    return res.status(201).json({ message: "User created!" });
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

    const token = signToken({ id: String(user._id), email: user.email, name: user.name, avatar: user.selectedAvatar });
    return res.json({
      token,
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
