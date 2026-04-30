import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { toApiTask } from "../types";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

// List all tasks across projects I can see
tasksRouter.get("/", async (req, res) => {
  const projects =
    req.userRole === "admin"
      ? await prisma.project.findMany({ select: { id: true } })
      : await prisma.project.findMany({
          where: { members: { some: { userId: req.userId! } } },
          select: { id: true },
        });
  const projectIds = projects.map((p) => p.id);
  const tasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
  });
  res.json(tasks.map(toApiTask));
});

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  status: z.enum(["todo", "in_progress", "done"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

// Create — must be project member or admin
tasksRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    include: { members: true },
  });
  if (!project) return res.status(404).json({ error: "Project not found" });
  const isMember = project.members.some((m) => m.userId === req.userId);
  if (!isMember && req.userRole !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  if (data.assigneeId && !project.members.some((m) => m.userId === data.assigneeId))
    return res.status(400).json({ error: "Assignee must be a project member" });

  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? "",
      status: data.status ?? "todo",
      priority: data.priority ?? "medium",
      assigneeId: data.assigneeId ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdBy: req.userId!,
    },
  });
  res.status(201).json(toApiTask(task));
});

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

// Update — project member or admin
tasksRouter.patch("/:id", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { project: { include: { members: true } } },
  });
  if (!task) return res.status(404).json({ error: "Task not found" });
  const isMember = task.project.members.some((m) => m.userId === req.userId);
  if (!isMember && req.userRole !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  const data: any = { ...parsed.data };
  if (parsed.data.dueDate !== undefined)
    data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const updated = await prisma.task.update({ where: { id: req.params.id }, data });
  res.json(toApiTask(updated));
});

// Delete — admin or task creator
tasksRouter.delete("/:id", async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (req.userRole !== "admin" && task.createdBy !== req.userId)
    return res.status(403).json({ error: "Forbidden" });
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
