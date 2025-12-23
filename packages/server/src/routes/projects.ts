import { Hono } from "hono";
import { getProjectsData, addProject, removeProject } from "../utils/projects.js";

const projects = new Hono();

// GET /api/projects - Get all projects
projects.get("/", async (c) => {
  try {
    const projects = await getProjectsData();
    return c.json(projects);
  } catch (e) {
    console.error('Failed to get projects', e);
    return c.json({ error: "Failed to get projects" }, 500);
  }
});

// GET /api/projects/:id - Get a single project
projects.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const projects = await getProjectsData();
    const project = projects.find((p: any) => p.id === id);
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }
    return c.json(project);
  } catch (e) {
    console.error('Failed to get project', e);
    return c.json({ error: "Failed to get project" }, 500);
  }
});

// POST /api/projects - Add a new project
projects.post("/", async (c) => {
  const body = await c.req.json();
  const { path: projectPath, init } = body;

  if (!projectPath) {
    return c.json({ error: "path is required" }, 400);
  }

  try {
    const project = await addProject(projectPath, init);
    return c.json(project);
  } catch (e: any) {
    console.error('Failed to add project', e);
    if (e.message === 'PROJECT_NEEDS_INIT') {
      return c.json({ error: "PROJECT_NEEDS_INIT" }, 400);
    }
    return c.json({ error: e.message || "Failed to add project" }, 500);
  }
});

// DELETE /api/projects/:id - Remove a project
projects.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const projects = await removeProject(id);
    return c.json(projects);
  } catch (e) {
    console.error('Failed to remove project', e);
    return c.json({ error: "Failed to remove project" }, 500);
  }
});

export default projects;
