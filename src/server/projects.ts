import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as fs from 'fs/promises'
import * as path from 'path'
import { spawn } from 'child_process'

const CONFIG_FILE = 'beadwork.projects.json'

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
})

export type Project = z.infer<typeof ProjectSchema>

async function getProjectsData(): Promise<Project[]> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    return []
  }
}

async function saveProjectsData(projects: Project[]) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(projects, null, 2))
}

export const getProjects = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await getProjectsData()
  })

export const getProject = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const projects = await getProjectsData()
    return projects.find(p => p.id === id) || null
  })

export const addProject = createServerFn({ method: 'POST' })
  .inputValidator((data: { path: string, init?: boolean }) => data)
  .handler(async ({ data }) => {
    const projectPath = data.path
    const projects = await getProjectsData()
    
    // Validate path exists and has .beads
    try {
      const stat = await fs.stat(projectPath)
      if (!stat.isDirectory()) throw new Error('Not a directory')
      
      const beadsPath = path.join(projectPath, '.beads')
      try {
        await fs.access(beadsPath)
      } catch (e) {
        if (data.init) {
          await new Promise((resolve, reject) => {
            const proc = spawn('bd', ['init'], { cwd: projectPath })
            proc.on('close', (code) => {
              if (code === 0) resolve(null)
              else reject(new Error('Failed to initialize beads'))
            })
            proc.on('error', reject)
          })
        } else {
          throw new Error('PROJECT_NEEDS_INIT')
        }
      }
    } catch (e: any) {
      if (e.message === 'PROJECT_NEEDS_INIT') {
        throw e
      }
      throw new Error('Invalid beads project: ' + (e.message || projectPath))
    }

    const name = path.basename(projectPath)
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      path: projectPath,
    }

    // Check duplicates
    if (projects.some(p => p.path === projectPath)) {
      throw new Error('Project already exists')
    }

    projects.push(newProject)
    await saveProjectsData(projects)
    return newProject
  })

export const removeProject = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const projects = await getProjectsData()
    const filtered = projects.filter(p => p.id !== id)
    await saveProjectsData(filtered)
    return filtered
  })
