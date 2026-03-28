import "express-session";

declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
    isAdmin?: boolean;
    userId?: number | null;
    username?: string;
    fullName?: string;
    role?: "admin" | "user" | "real_estate_marketer" | "service_provider";
    otpVerifiedPhone?: string;
  }
}
