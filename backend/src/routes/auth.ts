import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, signToken } from "../middleware/auth";
import { toPublicUser } from "../types";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
  role: z.enum(["admin", "member"]).optional(),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const userCount = await prisma.user.count();
  // First user becomes admin automatically; otherwise honor request (default member).
  const finalRole = userCount === 0 ? "admin" : (role ?? "member");

  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, role: finalRole },
  });
  const token = signToken(user.id);
  res.status(201).json({ user: toPublicUser(user), token });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid credentials" });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken(user.id);
  res.json({ user: toPublicUser(user), token });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: toPublicUser(user) });
});
