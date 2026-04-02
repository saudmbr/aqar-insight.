import crypto from "crypto";

export type MobileAuthPayload = {
  exp: number;
  userId: number | null;
  username: string;
  fullName: string;
  role: "admin" | "user" | "real_estate_marketer" | "service_provider";
  isAdmin: boolean;
};

const TOKEN_PREFIX = "aqar_";

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ??
    "aqar-insight-secret-key-2025-change-in-production"
  );
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createMobileAuthToken(
  payload: Omit<MobileAuthPayload, "exp"> & { exp?: number },
): string {
  const finalPayload: MobileAuthPayload = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const encodedPayload = toBase64Url(JSON.stringify(finalPayload));
  const signature = signValue(encodedPayload);
  return `${TOKEN_PREFIX}${encodedPayload}.${signature}`;
}

export function verifyMobileAuthToken(token: string): MobileAuthPayload | null {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  const raw = token.slice(TOKEN_PREFIX.length);
  const [encodedPayload, signature] = raw.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const actual = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as MobileAuthPayload;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
