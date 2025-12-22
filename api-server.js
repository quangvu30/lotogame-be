const express = require("express");
const cors = require("cors");
const app = express();

const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// In-memory user store (replace with database in production)
const users = [
  { username: "admin", password: "admin123" },
  { username: "user", password: "user123" },
];

// Basic auth middleware
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header",
    });
  }

  try {
    // Decode base64 credentials
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    const [username, password] = credentials.split(":");

    // Find user
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    // Attach user to request
    req.user = { username: user.username };
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid Authorization header format",
    });
  }
};

// Public route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Loto Game API",
    endpoints: {
      login: "POST /api/login",
      profile: "GET /api/profile (requires auth)",
      health: "GET /api/health",
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Login endpoint with basic auth
app.post("/api/login", basicAuth, (req, res) => {
  res.json({
    success: true,
    message: "Login successful",
    user: {
      username: req.user.username,
      secret: "random-generated-token-12345",
    },
    timestamp: new Date().toISOString(),
  });
});

// Protected route example
app.get("/api/profile", basicAuth, (req, res) => {
  res.json({
    user: {
      username: req.user.username,
    },
    message: "This is a protected route",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Express API server listening on port ${PORT}`);
});

module.exports = { app, server };
