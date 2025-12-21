import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { spawn } from 'child_process'

// Define the schema based on bd list --json output
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
})

export type Bead = z.infer<typeof BeadSchema>

export const CommentSchema = z.object({
  id: z.string(),
  author: z.string(),
  content: z.string(),
  created_at: z.string(),
})

export type Comment = z.infer<typeof CommentSchema>

export const DependencySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  type: z.string(),
})

export type Dependency = z.infer<typeof DependencySchema>

// Helper to run bd command
async function runBd(args: string[], cwd: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('bd', args, { cwd })
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`bd command failed with code ${code}: ${stderr}`))
      } else {
        try {
          // Attempt to parse JSON if expected
          if (args.includes('--json')) {
            if (!stdout.trim()) return resolve(null)
            resolve(JSON.parse(stdout))
          } else {
            resolve(stdout)
          }
        } catch (e) {
            // Fallback for non-json output or parsing error
            console.error("Parse error", e)
            resolve(stdout)
        }
      }
    })
    
    proc.on('error', (err) => {
        reject(err)
    })
  })
}

export const getBeads = createServerFn({ method: 'GET' })
  .inputValidator((projectPath: string) => projectPath)
  .handler(async ({ data: projectPath }) => {
    try {
      const beads = await runBd(['list', '--json'], projectPath)
      return (beads || []) as Bead[]
    } catch (e) {
      console.error('Failed to list beads', e)
      return []
    }
  })

export const getBead = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectPath: string, id: string }) => data)
  .handler(async ({ data }) => {
     try {
       // bd show returns details. It might not support --json fully for all details in older versions, 
       // but based on help it does.
       const result = await runBd(['show', data.id, '--json'], data.projectPath)
       return Array.isArray(result) ? result[0] : result
     } catch (e) {
       console.error('Failed to get bead', e)
       return null
     }
  })

export const updateBead = createServerFn({ method: 'POST' })
  .inputValidator((data: { 
    projectPath: string
    id: string
    title?: string
    description?: string
    status?: string 
    priority?: string
  }) => data)
  .handler(async ({ data }) => {
    const args = ['update', data.id]
    
    if (data.title) args.push('--title', data.title)
    if (data.description) args.push('--description', data.description)
    if (data.status) args.push('--status', data.status)
    if (data.priority) args.push('--priority', data.priority)

    await runBd(args, data.projectPath)
    return true
  })

export const deleteBead = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectPath: string, id: string }) => data)
  .handler(async ({ data }) => {
    await runBd(['delete', data.id], data.projectPath)
    return true
  })
  
export const createBead = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectPath: string, title: string, type?: string }) => data)
  .handler(async ({ data }) => {
      // Create via CLI: bd create "Title"
      // If type is needed, we might need flags or parsing.
      // bd create "Title" creates one issue.
      // We return the output or re-fetch.
      await runBd(['create', data.title], data.projectPath)
      return true
  })

export const getComments = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectPath: string, id: string }) => data)
  .handler(async ({ data }) => {
    try {
      const comments = await runBd(['comments', data.id, '--json'], data.projectPath)
      return (comments || []) as Comment[]
    } catch (e) {
      console.error('Failed to get comments', e)
      return []
    }
  })

export const addComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectPath: string, id: string, content: string }) => data)
  .handler(async ({ data }) => {
    await runBd(['comments', 'add', data.id, data.content], data.projectPath)
    return true
  })

export const getDependencies = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectPath: string, id: string }) => data)
  .handler(async ({ data }) => {
    try {
      // bd dep tree --json might be the best way to get direct dependencies
      // or we can use a different command if available.
      // Let's try list with filter if possible, but dep tree is more specific.
      const deps = await runBd(['dep', 'tree', data.id, '--json'], data.projectPath)
      return (deps || []) as Dependency[]
    } catch (e) {
      console.error('Failed to get dependencies', e)
      return []
    }
  })

export const addDependency = createServerFn({ method: 'POST' })
  .inputValidator((data: { 
    projectPath: string, 
    id: string, 
    dependsOnId: string, 
    type?: string 
  }) => data)
  .handler(async ({ data }) => {
    const args = ['dep', 'add', data.id, data.dependsOnId]
    if (data.type) args.push('--type', data.type)
    await runBd(args, data.projectPath)
    return true
  })

export const removeDependency = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectPath: string, id: string, dependsOnId: string }) => data)
  .handler(async ({ data }) => {
    await runBd(['dep', 'remove', data.id, data.dependsOnId], data.projectPath)
    return true
  })

export const getProjectStats = createServerFn({ method: 'GET' })
  .inputValidator((projectPath: string) => projectPath)
  .handler(async ({ data: projectPath }) => {
    try {
      const stats = await runBd(['status', '--json'], projectPath)
      return stats
    } catch (e) {
      console.error('Failed to get project stats', e)
      return null
    }
  })
