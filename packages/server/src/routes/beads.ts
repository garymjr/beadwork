import { Hono } from "hono";
import { z } from "zod";
import { runBd } from "../utils/beads.js";
import { generateTitle, createPlanAction } from "../utils/agent.js";

const beads = new Hono();

// Schemas
export const BeadSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(),
  priority: z.number().optional(),
  issue_type: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  dependency_count: z.number().optional(),
  dependent_count: z.number().optional(),
});

// GET /api/beads - List all beads for a project
beads.get("/", async (c) => {
  const projectPath = c.req.query("projectPath");
  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const result = await runBd(['list', '--json'], projectPath);
    return c.json(result || []);
  } catch (e) {
    console.error('Failed to list beads', e);
    return c.json({ error: "Failed to list beads" }, 500);
  }
});

// GET /api/beads/stats - Get project stats (must come before /:id route)
beads.get("/stats", async (c) => {
  const projectPath = c.req.query("projectPath");
  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const stats = await runBd(['status', '--json'], projectPath);
    return c.json(stats);
  } catch (e) {
    console.error('Failed to get project stats', e);
    return c.json(null);
  }
});

// GET /api/beads/:id - Get a single bead
beads.get("/:id", async (c) => {
  const id = c.req.param("id");
  const projectPath = c.req.query("projectPath");

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const result = await runBd(['show', id, '--json'], projectPath);
    return c.json(Array.isArray(result) ? result[0] : result);
  } catch (e) {
    console.error('Failed to get bead', e);
    return c.json({ error: "Failed to get bead" }, 500);
  }
});

// POST /api/beads - Create a new bead
beads.post("/", async (c) => {
  const body = await c.req.json();
  const { projectPath, title, description, type } = body;

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    let beadTitle = title;
    if (!beadTitle && description) {
      beadTitle = await generateTitle(description, projectPath);
    }

    if (!beadTitle) {
      return c.json({ error: "Title is required" }, 400);
    }

    const args = ['create', beadTitle];
    if (description) args.push('--description', description);
    if (type) args.push('--type', type);

    const output = await runBd(args, projectPath);
    
    // Extract bead ID from output
    const match = output?.match(/Created issue: ([\w-]+)/);
    const beadId = match?.[1];

    return c.json({ success: true, id: beadId });
  } catch (e) {
    console.error('Failed to create bead', e);
    return c.json({ error: "Failed to create bead" }, 500);
  }
});

// POST /api/beads/async - Create a bead asynchronously with generated title
beads.post("/async", async (c) => {
  const body = await c.req.json();
  const { projectPath, description, type, priority, transientId } = body;

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const placeholderTitle = description?.substring(0, 50) + '...' || 'Untitled Issue';
    
    const args = ['create', placeholderTitle];
    if (description) args.push('--description', description);
    if (type) args.push('--type', type);
    if (priority !== undefined) args.push('--priority', priority.toString());

    const output = await runBd(args, projectPath);
    
    const match = output?.match(/Created issue: ([\w-]+)/);
    const beadId = match?.[1];
    
    if (!beadId) {
      return c.json({ error: "Failed to create bead: No ID returned" }, 500);
    }

    return c.json({
      id: beadId,
      title: placeholderTitle,
      description,
      status: 'open',
      priority: priority || 2,
      issue_type: type || 'task',
      transientId
    });
  } catch (e) {
    console.error('Failed to create bead', e);
    return c.json({ error: "Failed to create bead" }, 500);
  }
});

// PUT /api/beads/:id - Update a bead
beads.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { projectPath, title, description, status, priority } = body;

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const args = ['update', id];
    if (title) args.push('--title', title);
    if (description) args.push('--description', description);
    if (status) args.push('--status', status);
    if (priority) args.push('--priority', priority);

    await runBd(args, projectPath);
    return c.json({ success: true });
  } catch (e) {
    console.error('Failed to update bead', e);
    return c.json({ error: "Failed to update bead" }, 500);
  }
});

// DELETE /api/beads/:id - Delete a bead
beads.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const projectPath = c.req.query("projectPath");

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    await runBd(['delete', id, '--force'], projectPath);
    return c.json({ success: true });
  } catch (e) {
    console.error('Failed to delete bead', e);
    return c.json({ error: "Failed to delete bead" }, 500);
  }
});

// GET /api/beads/:id/comments - Get comments for a bead
beads.get("/:id/comments", async (c) => {
  const id = c.req.param("id");
  const projectPath = c.req.query("projectPath");

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const comments = await runBd(['comments', id, '--json'], projectPath);
    return c.json(comments || []);
  } catch (e) {
    console.error('Failed to get comments', e);
    return c.json([]);
  }
});

// POST /api/beads/:id/comments - Add a comment to a bead
beads.post("/:id/comments", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { projectPath, content } = body;

  if (!projectPath || !content) {
    return c.json({ error: "projectPath and content are required" }, 400);
  }

  try {
    await runBd(['comments', 'add', id, content], projectPath);
    return c.json({ success: true });
  } catch (e) {
    console.error('Failed to add comment', e);
    return c.json({ error: "Failed to add comment" }, 500);
  }
});

// GET /api/beads/:id/dependencies - Get dependencies for a bead
beads.get("/:id/dependencies", async (c) => {
  const id = c.req.param("id");
  const projectPath = c.req.query("projectPath");

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const deps = await runBd(['dep', 'tree', id, '--json'], projectPath);
    return c.json(deps || []);
  } catch (e) {
    console.error('Failed to get dependencies', e);
    return c.json([]);
  }
});

// POST /api/beads/:id/dependencies - Add a dependency
beads.post("/:id/dependencies", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { projectPath, dependsOnId, type } = body;

  if (!projectPath || !dependsOnId) {
    return c.json({ error: "projectPath and dependsOnId are required" }, 400);
  }

  try {
    const args = ['dep', 'add', id, dependsOnId];
    if (type) args.push('--type', type);
    await runBd(args, projectPath);
    return c.json({ success: true });
  } catch (e) {
    console.error('Failed to add dependency', e);
    return c.json({ error: "Failed to add dependency" }, 500);
  }
});

// DELETE /api/beads/:id/dependencies/:dependsOnId - Remove a dependency
beads.delete("/:id/dependencies/:dependsOnId", async (c) => {
  const id = c.req.param("id");
  const dependsOnId = c.req.param("dependsOnId");
  const projectPath = c.req.query("projectPath");

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    await runBd(['dep', 'remove', id, dependsOnId], projectPath);
    return c.json({ success: true });
  } catch (e) {
    console.error('Failed to remove dependency', e);
    return c.json({ error: "Failed to remove dependency" }, 500);
  }
});

// POST /api/beads/:id/plan - Create a plan for a bead
beads.post("/:id/plan", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { projectPath, title, description, issue_type } = body;

  if (!projectPath) {
    return c.json({ error: "projectPath is required" }, 400);
  }

  try {
    const planResult = await createPlanAction(
      title || '',
      description || '',
      issue_type || 'task',
      projectPath
    );

    // Create subtasks and add as dependencies
    for (const subtask of planResult.subtasks) {
      const args = ['create', subtask.title];
      if (subtask.description) args.push('--description', subtask.description);
      if (subtask.type) args.push('--type', subtask.type);
      
      const output = await runBd(args, projectPath);
      const match = output.match(/Created issue: ([\w-]+)/);
      if (match) {
        const subtaskId = match[1];
        await runBd(['dep', 'add', id, subtaskId], projectPath);
      }
    }

    return c.json({ success: true, plan: planResult });
  } catch (e) {
    console.error('Failed to create plan', e);
    return c.json({ error: "Failed to create plan" }, 500);
  }
});

// POST /api/agent/generate-title - Generate a title from description
beads.post("/agent/generate-title", async (c) => {
  const body = await c.req.json();
  const { description, projectPath } = body;

  if (!description) {
    return c.json({ error: "description is required" }, 400);
  }

  try {
    const title = await generateTitle(description, projectPath);
    return c.json({ title });
  } catch (e) {
    console.error('Failed to generate title', e);
    return c.json({ error: "Failed to generate title" }, 500);
  }
});

export default beads;
