import { serve } from "bun";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import beads from "./routes/beads.js";
import projects from "./routes/projects.js";
import filesystem from "./routes/filesystem.js";
import { watcherManager } from "./utils/watcher.js";

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
      filesystem: "/api/filesystem",
      websocket: "/ws"
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

const server = serve({
  fetch(req, server) {
    // Handle WebSocket upgrade for /ws
    const url = new URL(req.url);
    
    if (url.pathname === "/ws") {
      const projectPath = url.searchParams.get('projectPath');
      
      if (!projectPath) {
        return new Response("projectPath query parameter is required", { status: 400 });
      }
      
      const upgraded = server.upgrade(req, {
        data: { projectPath }
      });
      
      if (upgraded) {
        return undefined; // Connection upgraded to WebSocket
      }
      
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    
    // Pass all other requests to Hono
    return app.fetch(req);
  },
  port,
  websocket: {
    message(ws, message) {
      // Handle incoming messages from client
      try {
        const data = JSON.parse(message.toString());
        // Could handle client commands here if needed
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    },
    open(ws) {
      // Extract projectPath from data passed during upgrade
      const projectPath = ws.data.projectPath;
      
      console.log(`WebSocket connected for project: ${projectPath}`);
      watcherManager.addClient(ws, projectPath);
      
      // Send confirmation to client
      ws.send(JSON.stringify({
        type: 'connected',
        projectPath,
        timestamp: new Date().toISOString(),
      }));
    },
    close(ws, code, reason) {
      console.log(`WebSocket disconnected: ${code} - ${reason}`);
      watcherManager.removeClient(ws);
    },
    error(ws, error) {
      console.error('WebSocket error:', error);
      watcherManager.removeClient(ws);
    },
  },
});

console.log(`✅ Server running at http://localhost:${port}`);
