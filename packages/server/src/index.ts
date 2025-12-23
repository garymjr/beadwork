import { serve } from "bun";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import beads from "./routes/beads.js";
import projects from "./routes/projects.js";
import filesystem from "./routes/filesystem.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

// Root
app.get("/", (c) => {
  return c.json({ 
    name: "Beadwork API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      beads: "/api/beads",
      projects: "/api/projects",
      filesystem: "/api/filesystem"
    }
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.route("/api/beads", beads);
app.route("/api/projects", projects);
app.route("/api/filesystem", filesystem);

// Start server
const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 Starting Beadwork API server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
