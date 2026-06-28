import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../middleware/errorHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required.", 400);
  }
  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters.", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  // Only allow self-registration as student or instructor; admin accounts are seeded/promoted manually
  const safeRole = role === "instructor" ? "instructor" : "student";

  const user = await User.create({ name, email, password, role: safeRole });
  const token = generateToken(user.id, user.role);

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = generateToken(user.id, user.role);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
  });
});

export const getMe = asyncHandler(async (req: any, res: Response) => {
  res.json({ user: req.user });
});
