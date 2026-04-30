import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { toApiProject } from "../types";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

// List projects visible to me (admins see all)
projectsRouter.get("/", async (req, res) => {
  const where =
    req.userRole === "admin"
      ? {}
      : { members: { some: { userId: req.userId! } } };
  const projects = await prisma.project.findMany({
    where,
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(projects.map(toApiProject));
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
});

// Create — admin only
projectsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, description } = parsed.data;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: req.userId!,
      members: { create: { userId: req.userId! } },
    },
    include: { members: true },
  });
  res.status(201).json(toApiProject(project));
});

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

// Update — admin or owner
projectsRouter.patch("/:id", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: "Project not found" });
  if (req.userRole !== "admin" && project.ownerId !== req.userId)
    return res.status(403).json({ error: "Forbidden" });

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { members: true },
  });
  res.json(toApiProject(updated));
});

// Delete — admin only
projectsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: "Project not found" });
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

const memberSchema = z.object({ email: z.string().email() });

// Add member — admin only
projectsRouter.post("/:id/members", requireAdmin, async (req, res) => {
  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid email required" });
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: "Project not found" });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return res.status(404).json({ error: "No user with that email" });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    create: { projectId: project.id, userId: user.id },
    update: {},
  });
  const updated = await prisma.project.findUnique({
    where: { id: project.id },
    include: { members: true },
  });
  res.json(toApiProject(updated!));
});

// Remove member — admin only
projectsRouter.delete("/:id/members/:userId", requireAdmin, async (req, res) => {
  await prisma.projectMember
    .delete({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    })
    .catch(() => null);
  const updated = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { members: true },
  });
  if (!updated) return res.status(404).json({ error: "Project not found" });
  res.json(toApiProject(updated));
});

// Tasks for a project
projectsRouter.get("/:id/tasks", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { members: true },
  });
  if (!project) return res.status(404).json({ error: "Project not found" });
  const isMember = project.members.some((m) => m.userId === req.userId);
  if (!isMember && req.userRole !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.id },
    orderBy: { createdAt: "desc" },
  });
  const { toApiTask } = await import("../types");
  res.json(tasks.map(toApiTask));
});
