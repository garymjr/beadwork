import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export async function getDirectoryListing(dirPath?: string) {
  try {
    const targetPath = dirPath ? path.resolve(dirPath) : os.homedir();
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    
    const fileEntries: any[] = [];
    
    for (const entry of entries) {
      // We only care about directories for project selection
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        fileEntries.push({
          name: entry.name,
          path: path.join(targetPath, entry.name),
          isDirectory: true
        });
      }
    }
    
    return {
      currentPath: targetPath,
      parentPath: targetPath === path.parse(targetPath).root ? null : path.dirname(targetPath),
      entries: fileEntries.sort((a, b) => a.name.localeCompare(b.name))
    };
  } catch (e) {
    console.error('Failed to read directory', e);
    throw new Error('Failed to read directory');
  }
}
