require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Di belakang reverse proxy (Nginx/Apache/cPanel/dll)
app.set("trust proxy", 1);

// Security & CORS
app.use(
  helmet({
    // Server dilayani lewat HTTP biasa (IP internal), jadi jangan paksa HTTPS
    strictTransportSecurity: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'"],
        mediaSrc: ["'self'", "data:", "blob:"],
        upgradeInsecureRequests: null,
      },
    },
  }),
);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://127.0.0.1:5173")
  .split(",")
  .map((o) => o.trim());

function isLoopback(origin) {
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);
  } catch (e) {
    return false;
  }
}

app.use((req, res, next) =>
  cors({
    origin(origin, callback) {
      // Same-origin (frontend disajikan server ini) selalu diizinkan
      let sameOrigin = false;
      try {
        const originHost = origin ? new URL(origin).host : "";
        const hosts = [
          req.headers.host,
          req.headers["x-forwarded-host"],
          req.hostname,
        ]
          .filter(Boolean)
          .flatMap((h) =>
            String(h)
              .split(",")
              .map((s) => s.trim()),
          );
        sameOrigin = !!originHost && hosts.includes(originHost);
      } catch (e) {
        sameOrigin = false;
      }
      if (!origin || sameOrigin || isLoopback(origin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin tidak diizinkan oleh CORS"));
    },
    credentials: true,
  })(req, res, next),
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", quizRoutes);
app.use("/api/attempt", attemptRoutes);
app.use("/api/admin", adminRoutes);

// Serve frontend (hasil build client/dist) + SPA fallback
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => err && next());
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  if (err.message === "Origin tidak diizinkan oleh CORS") {
    return res.status(403).json({ message: err.message });
  }
  return res
    .status(500)
    .json({ message: "Terjadi kesalahan internal server." });
});

module.exports = app;
