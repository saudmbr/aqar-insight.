import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const authRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "AqarInsight2025";

// ─── Login ────────────────────────────────────────────────────────────────────
authRouter.post("/login", async (req: Request, res: Response) => {
  const { identifier, password } = req.body as {
    identifier?: string;
    password?: string;
  };

  if (!identifier || !password) {
    res.status(400).json({ message: "يرجى إدخال اسم المستخدم وكلمة المرور" });
    return;
  }

  const id = identifier.trim();

  // 1. Check hardcoded admin
  if (id === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.isAdmin = true;
    req.session.userId = null;
    req.session.username = ADMIN_USERNAME;
    req.session.fullName = "المدير";
    req.session.role = "admin";

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ message: "حدث خطأ في الخادم، يرجى المحاولة مجدداً" });
        return;
      }
      res.json({
        success: true,
        username: ADMIN_USERNAME,
        fullName: "المدير",
        role: "admin",
      });
    });
    return;
  }

  // 2. Look up user in DB by username OR email
  try {
    const rows = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.username, id), eq(usersTable.email, id)))
      .limit(1);

    const user = rows[0];

    if (!user) {
      res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      return;
    }

    const role = (user.role === "admin" ? "admin" : "user") as "admin" | "user";

    req.session.isAuthenticated = true;
    req.session.isAdmin = role === "admin";
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.fullName = user.fullName;
    req.session.role = role;

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ message: "حدث خطأ في الخادم، يرجى المحاولة مجدداً" });
        return;
      }
      res.json({
        success: true,
        username: user.username,
        fullName: user.fullName,
        role,
      });
    });
  } catch {
    res.status(500).json({ message: "حدث خطأ في الخادم، يرجى المحاولة مجدداً" });
  }
});

// ─── Signup ───────────────────────────────────────────────────────────────────
authRouter.post("/signup", async (req: Request, res: Response) => {
  const { fullName, username, email, password } = req.body as {
    fullName?: string;
    username?: string;
    email?: string;
    password?: string;
  };

  if (!fullName?.trim() || !username?.trim() || !email?.trim() || !password) {
    res.status(400).json({ message: "يرجى ملء جميع الحقول المطلوبة" });
    return;
  }

  if (username.trim().length < 3) {
    res.status(400).json({ message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" });
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    res.status(400).json({
      message: "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط",
    });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ message: "يرجى إدخال بريد إلكتروني صحيح" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    return;
  }

  try {
    // Check for duplicates
    const existing = await db
      .select({ username: usersTable.username, email: usersTable.email })
      .from(usersTable)
      .where(
        or(
          eq(usersTable.username, username.trim()),
          eq(usersTable.email, email.trim().toLowerCase()),
        ),
      )
      .limit(1);

    if (existing[0]) {
      if (existing[0].username === username.trim()) {
        res.status(409).json({ message: "اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر" });
      } else {
        res.status(409).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "user",
      })
      .returning();

    // Auto-login after signup
    req.session.isAuthenticated = true;
    req.session.isAdmin = false;
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    req.session.fullName = newUser.fullName;
    req.session.role = "user";

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ message: "تم إنشاء الحساب ولكن حدث خطأ في تسجيل الدخول" });
        return;
      }
      res.status(201).json({
        success: true,
        username: newUser.username,
        fullName: newUser.fullName,
        role: "user",
      });
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ message: "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل" });
    } else {
      res.status(500).json({ message: "حدث خطأ في الخادم، يرجى المحاولة مجدداً" });
    }
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
authRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
      return;
    }
    res.clearCookie("aqar.sid");
    res.json({ success: true });
  });
});

// ─── Me ───────────────────────────────────────────────────────────────────────
authRouter.get("/me", (req: Request, res: Response) => {
  if (req.session.isAuthenticated) {
    res.json({
      isAuthenticated: true,
      isAdmin: req.session.isAdmin ?? false,
      username: req.session.username,
      fullName: req.session.fullName,
      role: req.session.role,
    });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
});

export default authRouter;
