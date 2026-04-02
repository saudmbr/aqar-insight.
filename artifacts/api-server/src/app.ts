import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { verifyMobileAuthToken } from "./lib/mobile-auth";

const PgStore = connectPgSimple(session);

const app: Express = express();

// Trust Replit's TLS-terminating reverse proxy so that:
// - req.secure is true when the original request was HTTPS
// - X-Forwarded-* headers are respected for IP, host, and protocol
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS: allow the same-origin Replit proxy with credentials
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow same-origin requests (no origin header) and any replit.app/dev domain
      if (!origin) return callback(null, true);
      if (
        origin.includes("replit.app") ||
        origin.includes("replit.dev") ||
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }
      callback(null, true); // Allow all for now — tighten in production if needed
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";
const usePgSessionStore = isProduction && Boolean(process.env.DATABASE_URL);
const sessionStore = usePgSessionStore
  ? new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true,
      ttl: 7 * 24 * 60 * 60,
      pruneSessionInterval: 60 * 15,
    })
  : undefined;

app.use(
  session({
    name: "aqar.sid",
    secret:
      process.env.SESSION_SECRET ??
      "aqar-insight-secret-key-2025-change-in-production",
    resave: false,
    saveUninitialized: false,
    // In production, persist sessions in PostgreSQL.
    // In development/Replit preview, fallback to in-memory store to avoid
    // auth failures when session table/connection is not ready.
    ...(sessionStore ? { store: sessionStore } : {}),
    cookie: {
      httpOnly: true,
      // In production behind Replit's HTTPS proxy, mark cookie as secure.
      // "trust proxy" above ensures Express knows the original request was HTTPS.
      secure: isProduction,
      // "lax" works for same-site navigation; both frontend and API share
      // the same .replit.app domain so they are always same-site.
      // Use "none" only if cross-site embedding is needed (requires secure:true).
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms (longer for mobile persistence)
    },
  }),
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const payload = verifyMobileAuthToken(token);
  if (!payload) {
    next();
    return;
  }

  req.session.isAuthenticated = true;
  req.session.isAdmin = payload.isAdmin;
  req.session.userId = payload.userId;
  req.session.username = payload.username;
  req.session.fullName = payload.fullName;
  req.session.role = payload.role;
  next();
});

app.use("/api", router);

// Ensure unknown API paths always return JSON (never HTML).
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

// Ensure API errors are returned as JSON to prevent frontend JSON parse crashes.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled API error");

  const statusCode =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : typeof err === "object" &&
          err !== null &&
          "statusCode" in err &&
          typeof (err as { statusCode?: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;

  const message =
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
      ? (err as { message: string }).message
      : "Internal server error";

  // Body parser syntax errors should return a clear 400 JSON response.
  if (statusCode === 400 && /json/i.test(message)) {
    res.status(400).json({ message: "Invalid JSON body" });
    return;
  }

  res.status(statusCode).json({ message });
});

export default app;
