import * as fs from "fs/promises";
import * as path from "path";
import { spawn } from "child_process";

const CONFIG_FILE = 'beadwork.projects.json';

export async function getProjectsData() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export async function saveProjectsData(projects: any[]) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(projects, null, 2));
}

export async function addProject(projectPath: string, init?: boolean) {
  const projects = await getProjectsData();
  
  // Validate path exists and has .beads
  try {
    const stat = await fs.stat(projectPath);
    if (!stat.isDirectory()) throw new Error('Not a directory');
    
    const beadsPath = path.join(projectPath, '.beads');
    try {
      await fs.access(beadsPath);
    } catch (e) {
      if (init) {
        await new Promise((resolve, reject) => {
          const proc = spawn('bd', ['init'], { cwd: projectPath });
          proc.on('close', (code: number) => {
            if (code === 0) resolve(null);
            else reject(new Error('Failed to initialize beads'));
          });
          proc.on('error', reject);
        });
      } else {
        throw new Error('PROJECT_NEEDS_INIT');
      }
    }
  } catch (e: any) {
    if (e.message === 'PROJECT_NEEDS_INIT') {
      throw e;
    }
    throw new Error('Invalid beads project: ' + (e.message || projectPath));
  }

  const name = path.basename(projectPath);
  const newProject = {
    id: crypto.randomUUID(),
    name,
    path: projectPath,
  };

  // Check duplicates
  if (projects.some((p: any) => p.path === projectPath)) {
    throw new Error('Project already exists');
  }

  projects.push(newProject);
  await saveProjectsData(projects);
  return newProject;
}

export async function removeProject(id: string) {
  const projects = await getProjectsData();
  const filtered = projects.filter((p: any) => p.id !== id);
  await saveProjectsData(filtered);
  return filtered;
}
