import { createServerFn } from '@tanstack/react-start'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export type FileEntry = {
  name: string
  path: string
  isDirectory: boolean
}

export type DirectoryListing = {
  currentPath: string
  parentPath: string | null
  entries: FileEntry[]
}

export const getDirectoryListing = createServerFn({ method: 'GET' })
  .inputValidator((dirPath?: string) => dirPath)
  .handler(async ({ data: dirPath }) => {
    try {
      const targetPath = dirPath ? path.resolve(dirPath) : os.homedir()
      const entries = await fs.readdir(targetPath, { withFileTypes: true })
      
      const fileEntries: FileEntry[] = []
      
      for (const entry of entries) {
        // We only care about directories for project selection
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
           fileEntries.push({
             name: entry.name,
             path: path.join(targetPath, entry.name),
             isDirectory: true
           })
        }
      }
      
      // Add hidden .beads folder if it exists, as it's relevant context
      // Actually, we probably want to see if the current folder IS a project
      // But for navigation, let's just list directories.
      
      return {
        currentPath: targetPath,
        parentPath: targetPath === path.parse(targetPath).root ? null : path.dirname(targetPath),
        entries: fileEntries.sort((a, b) => a.name.localeCompare(b.name))
      }
    } catch (e) {
      console.error('Failed to read directory', e)
      throw new Error('Failed to read directory')
    }
  })
