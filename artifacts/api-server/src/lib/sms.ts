/**
 * SMS Provider Layer — عقار إنسايت
 *
 * Provider-agnostic SMS sending layer.
 * In dev/test mode: prints OTP to console instead of sending.
 * In production: plugs into the configured SMS provider.
 *
 * To connect a real provider, set these environment variables:
 *   SMS_PROVIDER=twilio   (or "unifonic" | "stcpay" | "msegat")
 *   SMS_FROM=+966XXXXXXXXX
 *
 * For Twilio:
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxx
 *   TWILIO_AUTH_TOKEN=xxxxxxxx
 *
 * For Unifonic (popular in Saudi):
 *   UNIFONIC_APP_SID=xxxxxxxx
 *
 * For Msegat (Saudi SMS provider):
 *   MSEGAT_API_KEY=xxxxxxxx
 *   MSEGAT_USERNAME=xxxxxxxx
 */

const SMS_PROVIDER = process.env.SMS_PROVIDER ?? "";

export function isSmsProviderConfigured(): boolean {
  return !!SMS_PROVIDER;
}

export async function sendSmsOtp(phoneNumber: string, otpCode: string): Promise<void> {
  const message = `رمز التحقق الخاص بك في عقار إنسايت هو: ${otpCode}\nصالح لمدة 10 دقائق. لا تشاركه مع أحد.`;

  if (!SMS_PROVIDER) {
    console.log("─────────────────────────────────────────");
    console.log(`[SMS TEST MODE] إلى: ${phoneNumber}`);
    console.log(`[SMS TEST MODE] رمز OTP: ${otpCode}`);
    console.log("─────────────────────────────────────────");
    return;
  }

  if (SMS_PROVIDER === "twilio") {
    await sendViaTwilio(phoneNumber, message);
  } else if (SMS_PROVIDER === "msegat") {
    await sendViaMsegat(phoneNumber, message);
  } else if (SMS_PROVIDER === "unifonic") {
    await sendViaUnifonic(phoneNumber, message);
  } else {
    console.error(`[SMS] Unknown provider: ${SMS_PROVIDER}. Falling back to console log.`);
    console.log(`[SMS FALLBACK] OTP for ${phoneNumber}: ${otpCode}`);
  }
}

async function sendViaTwilio(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.SMS_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, SMS_FROM)");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error: ${err}`);
  }
}

async function sendViaMsegat(to: string, body: string): Promise<void> {
  const apiKey = process.env.MSEGAT_API_KEY;
  const username = process.env.MSEGAT_USERNAME;
  const from = process.env.SMS_FROM ?? "عقار";

  if (!apiKey || !username) {
    throw new Error("Msegat credentials not configured (MSEGAT_API_KEY, MSEGAT_USERNAME)");
  }

  const res = await fetch("https://www.msegat.com/gw/sendsms.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: username,
      apiKey,
      numbers: to,
      userSender: from,
      msg: body,
    }),
  });

  if (!res.ok) {
    throw new Error(`Msegat error: ${res.statusText}`);
  }
}

async function sendViaUnifonic(to: string, body: string): Promise<void> {
  const appSid = process.env.UNIFONIC_APP_SID;
  const from = process.env.SMS_FROM ?? "عقار إنسايت";

  if (!appSid) {
    throw new Error("Unifonic credentials not configured (UNIFONIC_APP_SID)");
  }

  const res = await fetch("https://el.cloud.unifonic.com/rest/SMS/messages", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      AppSid: appSid,
      SenderID: from,
      Body: body,
      Recipient: to,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Unifonic error: ${res.statusText}`);
  }
}
