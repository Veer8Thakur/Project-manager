import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { projectsRouter } from "./routes/projects";
import { tasksRouter } from "./routes/tasks";

const app = express();

const origins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.includes("*") ? true : origins,
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.json({ ok: true, name: "teamflow-api" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`teamflow-api listening on :${port}`);
});
