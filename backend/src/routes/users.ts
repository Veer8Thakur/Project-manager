import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { toPublicUser } from "../types";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json(users.map(toPublicUser));
});
