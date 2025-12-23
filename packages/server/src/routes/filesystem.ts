import { Hono } from "hono";
import { getDirectoryListing } from "../utils/filesystem.js";

const filesystem = new Hono();

// GET /api/filesystem/directory - List directory contents
filesystem.get("/directory", async (c) => {
  const path = c.req.query("path");
  
  try {
    const listing = await getDirectoryListing(path);
    return c.json(listing);
  } catch (e) {
    console.error('Failed to read directory', e);
    return c.json({ error: "Failed to read directory" }, 500);
  }
});

export default filesystem;
