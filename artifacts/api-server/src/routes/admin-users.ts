import { Router } from "express";
import type { Request, Response } from "express";
import { eq, desc, ne } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const adminUsersRouter = Router();

// Middleware: admin only
adminUsersRouter.use((req: Request, res: Response, next) => {
  if (!req.session.isAdmin) {
    res.status(403).json({ message: "غير مصرح لك" }); return;
  }
  next();
});

// ─── List all users ───────────────────────────────────────────────────────────
adminUsersRouter.get("/", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json(rows);
});

// ─── Update user role ─────────────────────────────────────────────────────────
adminUsersRouter.put("/:id/role", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const { role } = req.body as { role?: string };
  const validRoles = ["user", "real_estate_marketer", "service_provider", "admin"];
  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ message: "دور غير صحيح" }); return;
  }

  await db.update(usersTable).set({ role }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

// ─── Delete user ──────────────────────────────────────────────────────────────
adminUsersRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default adminUsersRouter;
