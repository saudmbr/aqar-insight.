import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, or, and, gt, isNull, lt } from "drizzle-orm";
import {
  db,
  usersTable,
  passwordResetTokensTable,
  serviceProvidersTable,
  otpVerificationsTable,
} from "@workspace/db";
import { sendPasswordResetEmail } from "../lib/email.js";
import { sendSmsOtp, isSmsProviderConfigured } from "../lib/sms.js";

const authRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "AqarInsight2025";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

/* ─── Saudi phone normalizer ────────────────────────────────────────────────── */
function normalizeSaudiPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (/^05\d{8}$/.test(cleaned)) return "+966" + cleaned.slice(1);
  if (/^\+9665\d{8}$/.test(cleaned)) return cleaned;
  if (/^9665\d{8}$/.test(cleaned)) return "+" + cleaned;
  if (/^005\d{8}$/.test(cleaned)) return "+966" + cleaned.slice(2);
  return null;
}

/* ─── OTP in-memory rate limiter (send) ─────────────────────────────────────── */
const _otpSendMap = new Map<string, { count: number; resetAt: number }>();
const OTP_SEND_MAX = 5;
const OTP_SEND_WINDOW = 60 * 60 * 1000;
const OTP_TTL = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function checkOtpSendRate(phone: string): boolean {
  const now = Date.now();
  const entry = _otpSendMap.get(phone);
  if (!entry || now >= entry.resetAt) {
    _otpSendMap.set(phone, { count: 1, resetAt: now + OTP_SEND_WINDOW });
    return true;
  }
  if (entry.count >= OTP_SEND_MAX) return false;
  entry.count++;
  return true;
}

/* ─── Login ────────────────────────────────────────────────────────────────── */
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

  const isAdminLogin =
    id === ADMIN_USERNAME ||
    (ADMIN_EMAIL && id.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (isAdminLogin && password === ADMIN_PASSWORD) {
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
        userId: null,
        username: ADMIN_USERNAME,
        fullName: "المدير",
        email: ADMIN_EMAIL || null,
        role: "admin",
      });
    });
    return;
  }

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

    if (user.phoneNumber && !user.phoneVerified) {
      res.status(403).json({
        message: "يجب التحقق من رقم الجوال أولاً",
        requiresPhoneVerification: true,
        phoneNumber: user.phoneNumber,
      });
      return;
    }

    const role = (user.role ?? "user") as
      | "admin"
      | "user"
      | "real_estate_marketer"
      | "service_provider";

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
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        role,
      });
    });
  } catch {
    res.status(500).json({ message: "حدث خطأ في الخادم، يرجى المحاولة مجدداً" });
  }
});

/* ─── OTP: Send ──────────────────────────────────────────────────────────────── */
authRouter.post("/otp/send", async (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };

  if (!phone?.trim()) {
    res.status(400).json({ message: "يرجى إدخال رقم الجوال" });
    return;
  }

  const normalized = normalizeSaudiPhone(phone.trim());
  if (!normalized) {
    res.status(400).json({
      message: "يرجى إدخال رقم جوال سعودي صحيح (مثال: 0501234567)",
    });
    return;
  }

  if (!checkOtpSendRate(normalized)) {
    res.status(429).json({
      message: "تم تجاوز الحد الأقصى لطلبات الرمز. يرجى المحاولة بعد ساعة",
    });
    return;
  }

  try {
    await db
      .delete(otpVerificationsTable)
      .where(
        and(
          eq(otpVerificationsTable.phoneNumber, normalized),
          lt(otpVerificationsTable.expiresAt, new Date()),
        ),
      );

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otpCode, 6);
    const expiresAt = new Date(Date.now() + OTP_TTL);

    await db.insert(otpVerificationsTable).values({
      phoneNumber: normalized,
      otpHash,
      expiresAt,
    });

    await sendSmsOtp(normalized, otpCode);

    const testMode = !isSmsProviderConfigured();

    res.json({
      success: true,
      message: testMode
        ? "وضع الاختبار: لم يُهيَّأ مزوّد SMS — الرمز معروض أدناه"
        : "تم إرسال رمز التحقق إلى رقم الجوال",
      phone: normalized,
      testMode,
      ...(testMode ? { testOtp: otpCode } : {}),
    });
  } catch (err) {
    console.error("[otp/send]", err);
    res.status(500).json({ message: "حدث خطأ أثناء إرسال الرمز، يرجى المحاولة مجدداً" });
  }
});

/* ─── OTP: Verify ────────────────────────────────────────────────────────────── */
authRouter.post("/otp/verify", async (req: Request, res: Response) => {
  const { phone, code } = req.body as { phone?: string; code?: string };

  if (!phone?.trim() || !code?.trim()) {
    res.status(400).json({ message: "يرجى إدخال رقم الجوال ورمز التحقق" });
    return;
  }

  const normalized = normalizeSaudiPhone(phone.trim());
  if (!normalized) {
    res.status(400).json({ message: "رقم الجوال غير صحيح" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(otpVerificationsTable)
      .where(
        and(
          eq(otpVerificationsTable.phoneNumber, normalized),
          eq(otpVerificationsTable.used, false),
          gt(otpVerificationsTable.expiresAt, new Date()),
        ),
      )
      .orderBy(otpVerificationsTable.createdAt)
      .limit(1);

    const record = rows[0];

    if (!record) {
      res.status(400).json({
        message: "انتهت صلاحية الرمز أو لم يُرسَل. يرجى طلب رمز جديد",
        expired: true,
      });
      return;
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await db
        .update(otpVerificationsTable)
        .set({ used: true })
        .where(eq(otpVerificationsTable.id, record.id));
      res.status(429).json({
        message: "تم تجاوز عدد المحاولات المسموح بها. يرجى طلب رمز جديد",
        tooManyAttempts: true,
      });
      return;
    }

    const match = await bcrypt.compare(code.trim(), record.otpHash);

    if (!match) {
      await db
        .update(otpVerificationsTable)
        .set({ attempts: record.attempts + 1 })
        .where(eq(otpVerificationsTable.id, record.id));

      const remaining = OTP_MAX_ATTEMPTS - record.attempts - 1;
      res.status(400).json({
        message:
          remaining > 0
            ? `رمز التحقق غير صحيح. تبقّى ${remaining} محاولات`
            : "رمز التحقق غير صحيح. سيتم إلغاء الرمز عند المحاولة التالية",
        invalidCode: true,
      });
      return;
    }

    await db
      .update(otpVerificationsTable)
      .set({ used: true })
      .where(eq(otpVerificationsTable.id, record.id));

    req.session.otpVerifiedPhone = normalized;
    req.session.save((err) => {
      if (err) {
        res.status(500).json({ message: "حدث خطأ، يرجى المحاولة مجدداً" });
        return;
      }
      res.json({ success: true, message: "تم التحقق من رقم الجوال بنجاح" });
    });
  } catch (err) {
    console.error("[otp/verify]", err);
    res.status(500).json({ message: "حدث خطأ في الخادم، يرجى المحاولة مجدداً" });
  }
});

/* ─── Signup ─────────────────────────────────────────────────────────────────── */
authRouter.post("/signup", async (req: Request, res: Response) => {
  const { fullName, username, email, password, userType, serviceCategory, phone } =
    req.body as {
      fullName?: string;
      username?: string;
      email?: string;
      password?: string;
      userType?: string;
      serviceCategory?: string;
      phone?: string;
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

  /* ── Phone is optional (OTP temporarily disabled) ── */
  const normalizedPhone = phone?.trim() ? normalizeSaudiPhone(phone.trim()) : null;

  try {
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

    const validTypes = ["user", "real_estate_marketer", "service_provider"];
    const assignedRole = validTypes.includes(userType ?? "")
      ? (userType as "user" | "real_estate_marketer" | "service_provider")
      : "user";

    const [newUser] = await db
      .insert(usersTable)
      .values({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: assignedRole,
        ...(normalizedPhone ? {
          phoneNumber: normalizedPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        } : {}),
      })
      .returning();

    if (assignedRole === "service_provider" && serviceCategory) {
      await db.insert(serviceProvidersTable).values({
        userId: newUser.id,
        businessName: fullName.trim(),
        category: serviceCategory,
        city: "الرياض",
        status: "active",
      });
    }

    req.session.isAuthenticated = true;
    req.session.isAdmin = false;
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    req.session.fullName = newUser.fullName;
    req.session.role = assignedRole;

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ message: "تم إنشاء الحساب ولكن حدث خطأ في تسجيل الدخول" });
        return;
      }
      res.status(201).json({
        success: true,
        userId: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: assignedRole,
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

/* ─── Logout ────────────────────────────────────────────────────────────────── */
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

/* ─── Me ─────────────────────────────────────────────────────────────────────── */
authRouter.get("/me", (req: Request, res: Response) => {
  if (req.session.isAuthenticated) {
    res.json({
      isAuthenticated: true,
      isAdmin: req.session.isAdmin ?? false,
      userId: req.session.userId,
      username: req.session.username,
      fullName: req.session.fullName,
      role: req.session.role,
    });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
});

/* ─── Get Profile ────────────────────────────────────────────────────────────── */
authRouter.get("/profile", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول أولاً" });
    return;
  }

  if (!req.session.userId) {
    res.json({
      fullName: req.session.fullName ?? "المدير",
      username: req.session.username,
      email: ADMIN_EMAIL || null,
      role: "admin",
      createdAt: null,
    });
    return;
  }

  try {
    const rows = await db
      .select({
        fullName: usersTable.fullName,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        phoneNumber: usersTable.phoneNumber,
        phoneVerified: usersTable.phoneVerified,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ message: "المستخدم غير موجود" });
      return;
    }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

/* ─── Update Profile ─────────────────────────────────────────────────────────── */
authRouter.put("/profile", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.status(401).json({ message: "لا يمكن تعديل بيانات هذا الحساب" });
    return;
  }

  const { fullName, username, email } = req.body as {
    fullName?: string;
    username?: string;
    email?: string;
  };

  if (!fullName?.trim() || !username?.trim() || !email?.trim()) {
    res.status(400).json({ message: "يرجى ملء جميع الحقول" });
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

  try {
    const duplicate = await db
      .select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(
        or(
          eq(usersTable.username, username.trim()),
          eq(usersTable.email, email.trim().toLowerCase()),
        ),
      )
      .limit(1);

    if (duplicate[0] && duplicate[0].id !== req.session.userId) {
      const msg =
        duplicate[0].username === username.trim()
          ? "اسم المستخدم مستخدم بالفعل"
          : "البريد الإلكتروني مستخدم بالفعل";
      res.status(409).json({ message: msg });
      return;
    }

    await db
      .update(usersTable)
      .set({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
      })
      .where(eq(usersTable.id, req.session.userId));

    req.session.username = username.trim();
    req.session.fullName = fullName.trim();

    req.session.save(() => {
      res.json({ success: true, fullName: fullName.trim(), username: username.trim() });
    });
  } catch {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

/* ─── Change Password ────────────────────────────────────────────────────────── */
authRouter.put("/password", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.status(401).json({ message: "لا يمكن تغيير كلمة مرور هذا الحساب" });
    return;
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "يرجى ملء جميع الحقول" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" });
    return;
  }

  try {
    const rows = await db
      .select({ passwordHash: usersTable.passwordHash })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ message: "المستخدم غير موجود" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, rows[0].passwordHash);
    if (!valid) {
      res.status(401).json({ message: "كلمة المرور الحالية غير صحيحة" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(usersTable)
      .set({ passwordHash: newHash })
      .where(eq(usersTable.id, req.session.userId));

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

/* ─── Forgot Password ────────────────────────────────────────────────────────── */
const _fpRateMap = new Map<string, { count: number; resetAt: number }>();
const FP_MAX = 3;
const FP_WINDOW = 15 * 60 * 1000;
const TOKEN_TTL = 15 * 60 * 1000;

authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  const { identifier } = req.body as { identifier?: string };

  if (!identifier?.trim()) {
    res.status(400).json({ message: "يرجى إدخال البريد الإلكتروني" });
    return;
  }

  const key = identifier.trim().toLowerCase();
  const now = Date.now();
  const rate = _fpRateMap.get(key);

  if (rate) {
    if (now < rate.resetAt) {
      if (rate.count >= FP_MAX) {
        res.json({ success: true });
        return;
      }
      rate.count++;
    } else {
      _fpRateMap.set(key, { count: 1, resetAt: now + FP_WINDOW });
    }
  } else {
    _fpRateMap.set(key, { count: 1, resetAt: now + FP_WINDOW });
  }

  const GENERIC_SUCCESS = { success: true };

  try {
    const rows = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.email, key))
      .limit(1);

    if (!rows[0]) {
      res.json(GENERIC_SUCCESS);
      return;
    }

    const { id: userId, email } = rows[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(now + TOKEN_TTL);

    await db
      .delete(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.userId, userId),
          isNull(passwordResetTokensTable.usedAt),
        ),
      );

    await db.insert(passwordResetTokensTable).values({ userId, tokenHash, expiresAt });

    try {
      await sendPasswordResetEmail(email, rawToken);
    } catch (emailErr) {
      console.error("[forgot-password] Failed to send reset email:", emailErr);
      if (process.env.NODE_ENV === "production" && process.env.SMTP_HOST) {
        res.status(500).json({
          message: "حدث خطأ أثناء إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً",
        });
        return;
      }
    }

    res.json(GENERIC_SUCCESS);
  } catch {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

/* ─── Validate Reset Token ───────────────────────────────────────────────────── */
authRouter.get("/validate-reset-token", async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };

  if (!token) {
    res.json({ valid: false });
    return;
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const rows = await db
      .select({ id: passwordResetTokensTable.id })
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.tokenHash, tokenHash),
          isNull(passwordResetTokensTable.usedAt),
          gt(passwordResetTokensTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    res.json({ valid: !!rows[0] });
  } catch {
    res.status(500).json({ valid: false });
  }
});

/* ─── Reset Password ─────────────────────────────────────────────────────────── */
authRouter.post("/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token?.trim() || !password) {
    res.status(400).json({ message: "بيانات غير مكتملة" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    return;
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    res.status(400).json({ message: "كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً" });
    return;
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const rows = await db
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.tokenHash, tokenHash),
          isNull(passwordResetTokensTable.usedAt),
          gt(passwordResetTokensTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    const tokenRecord = rows[0];
    if (!tokenRecord) {
      res
        .status(400)
        .json({ message: "الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد." });
      return;
    }

    const newHash = await bcrypt.hash(password, 12);
    await db
      .update(usersTable)
      .set({ passwordHash: newHash })
      .where(eq(usersTable.id, tokenRecord.userId));
    await db
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, tokenRecord.id));

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

export default authRouter;
