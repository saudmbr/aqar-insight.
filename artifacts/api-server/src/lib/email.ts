import nodemailer from "nodemailer";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ─── Build app base URL ───────────────────────────────────────────────────────
// Priority: APP_URL env → REPLIT_DOMAINS (first entry) → localhost fallback
function getAppBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DOMAINS) {
    const first = process.env.REPLIT_DOMAINS.split(",")[0].trim();
    if (first) return `https://${first}`;
  }
  return "http://localhost:3000";
}

// ─── SMTP configured? ────────────────────────────────────────────────────────
function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// ─── Create transporter (lazy) ───────────────────────────────────────────────
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

// ─── Email templates ─────────────────────────────────────────────────────────
function buildResetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>استعادة كلمة المرور – عقار إنسايت</title>
</head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F1C3F,#0F7BA0);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">🏢 عقار إنسايت</p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">منصة ذكية لتحليل سوق العقار</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0F1C3F;">استعادة كلمة المرور</h1>
              <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
                تلقّينا طلباً لإعادة تعيين كلمة المرور المرتبطة بحسابك في منصة عقار إنسايت.
                إذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display:inline-block;background:linear-gradient(135deg,#0F7BA0,#0a5a75);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;letter-spacing:0.3px;">
                      إعادة تعيين كلمة المرور
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expire notice -->
              <div style="background:#FFF8E7;border:1px solid #F0D890;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#7A5C00;">
                  ⏱️ هذا الرابط صالح لمدة <strong>15 دقيقة</strong> فقط وللاستخدام مرة واحدة.
                </p>
              </div>

              <!-- Fallback link -->
              <p style="margin:0 0 6px;font-size:13px;color:#888;">إذا لم يعمل الزر، انسخ الرابط التالي وافتحه في متصفّحك:</p>
              <p style="margin:0;font-size:12px;color:#0F7BA0;word-break:break-all;">${resetLink}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                © ${new Date().getFullYear()} منصة عقار إنسايت · جميع الحقوق محفوظة<br/>
                إذا لم تطلب استعادة كلمة المرور، يُرجى تجاهل هذا البريد.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetEmailText(resetLink: string): string {
  return `منصة عقار إنسايت — استعادة كلمة المرور

تلقّينا طلباً لإعادة تعيين كلمة المرور لحسابك.

انقر على الرابط التالي لإعادة تعيين كلمة المرور (صالح لمدة 15 دقيقة):
${resetLink}

إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد.

© ${new Date().getFullYear()} منصة عقار إنسايت`;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(toEmail: string, rawToken: string): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  if (!isSmtpConfigured()) {
    // Dev mode — log to console only, never expose in API response
    const divider = "─".repeat(60);
    console.log(`\n${divider}`);
    console.log("📧  PASSWORD RESET LINK (dev mode — SMTP not configured)");
    console.log(`    To: ${toEmail}`);
    console.log(`    Link: ${resetLink}`);
    console.log(`${divider}\n`);

    if (IS_PRODUCTION) {
      // Fail loudly in production if email is not configured
      throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment secrets.");
    }
    return;
  }

  const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@aqar-insight.sa";
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"عقار إنسايت" <${fromAddress}>`,
    to: toEmail,
    subject: "استعادة كلمة المرور – منصة عقار إنسايت",
    text: buildResetEmailText(resetLink),
    html: buildResetEmailHtml(resetLink),
  });
}
