import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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

app.use(
  session({
    name: "aqar.sid",
    secret:
      process.env.SESSION_SECRET ??
      "aqar-insight-secret-key-2025-change-in-production",
    resave: false,
    saveUninitialized: false,
    // Store sessions in PostgreSQL so they survive across process restarts
    // and are shared between multiple worker processes in production
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: false,
      ttl: 24 * 60 * 60, // 1 day in seconds
      pruneSessionInterval: 60 * 15, // prune expired sessions every 15 minutes
    }),
    cookie: {
      httpOnly: true,
      // In production behind Replit's HTTPS proxy, mark cookie as secure.
      // "trust proxy" above ensures Express knows the original request was HTTPS.
      secure: isProduction,
      // "lax" works for same-site requests (same domain, frontend + API).
      // Replit hosts frontend and API on the same origin in both dev and prod.
      sameSite: isProduction ? "lax" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
    },
  }),
);

app.use("/api", router);

export default app;
