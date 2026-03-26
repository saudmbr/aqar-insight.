import { Router } from "express";
import type { Request, Response } from "express";

const authRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "AqarInsight2025";

authRouter.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ message: "يرجى إدخال اسم المستخدم وكلمة المرور" });
    return;
  }

  if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  req.session.isAdmin = true;
  req.session.username = ADMIN_USERNAME;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ message: "حدث خطأ في الخادم، يرجى المحاولة مجدداً" });
      return;
    }
    res.json({ success: true, username: ADMIN_USERNAME });
  });
});

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

authRouter.get("/me", (req: Request, res: Response) => {
  if (req.session.isAdmin) {
    res.json({ isAdmin: true, username: req.session.username });
  } else {
    res.status(401).json({ isAdmin: false });
  }
});

export default authRouter;
