import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@demo.com";
  const memberEmail = "member@demo.com";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "Admin User", email: adminEmail, passwordHash, role: "admin" },
  });
  const member = await prisma.user.upsert({
    where: { email: memberEmail },
    update: {},
    create: { name: "Member User", email: memberEmail, passwordHash, role: "member" },
  });

  const existing = await prisma.project.findFirst({ where: { name: "Website Redesign" } });
  if (!existing) {
    await prisma.project.create({
      data: {
        name: "Website Redesign",
        description: "Marketing site refresh for Q2 launch.",
        ownerId: admin.id,
        members: { create: [{ userId: admin.id }, { userId: member.id }] },
        tasks: {
          create: [
            { title: "Wireframes", description: "Low-fi wireframes.", status: "done", priority: "high", assigneeId: member.id, createdBy: admin.id },
            { title: "Brand tokens", description: "Color & type tokens.", status: "in_progress", priority: "medium", assigneeId: admin.id, createdBy: admin.id },
            { title: "QA pass", description: "Cross-browser QA.", status: "todo", priority: "low", createdBy: admin.id },
          ],
        },
      },
    });
  }
  console.log("Seed complete:", { admin: admin.email, member: member.email });
}

main().finally(() => prisma.$disconnect());
