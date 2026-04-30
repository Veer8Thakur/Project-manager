import type { Project, ProjectMember, Task, User } from "@prisma/client";

export type PublicUser = Omit<User, "passwordHash">;

export const toPublicUser = (u: User): PublicUser => {
  const { passwordHash, ...rest } = u;
  return rest;
};

export const toApiProject = (
  p: Project & { members: ProjectMember[] },
) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  ownerId: p.ownerId,
  memberIds: p.members.map((m) => m.userId),
  createdAt: p.createdAt.toISOString(),
});

export const toApiTask = (t: Task) => ({
  id: t.id,
  projectId: t.projectId,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  assigneeId: t.assigneeId,
  dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  createdAt: t.createdAt.toISOString(),
  createdBy: t.createdBy,
});

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: "admin" | "member";
    }
  }
}
