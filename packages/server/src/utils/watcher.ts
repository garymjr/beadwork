import chokidar from "chokidar";
import { existsSync } from "fs";
import type { ServerWebSocket } from "bun";

interface ClientConnection {
  ws: ServerWebSocket;
  projectPath: string;
}

interface FileWatcher {
  watcher: chokidar.FSWatcher;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  clients: Set<ServerWebSocket>;
}

class WatcherManager {
  private clients: Map<ServerWebSocket, ClientConnection> = new Map();
  private clientsByProject: Map<string, Set<ServerWebSocket>> = new Map();
  private fileWatchers: Map<string, FileWatcher> = new Map();

  addClient(ws: ServerWebSocket, projectPath: string): void {
    this.clients.set(ws, { ws, projectPath });
    
    if (!this.clientsByProject.has(projectPath)) {
      this.clientsByProject.set(projectPath, new Set());
    }
    this.clientsByProject.get(projectPath)!.add(ws);

    // Start watching the .beads directory for this project
    this.startWatching(projectPath);
  }

  removeClient(ws: ServerWebSocket): void {
    const client = this.clients.get(ws);
    if (client) {
      const { projectPath } = client;
      this.clients.delete(ws);
      
      const projectClients = this.clientsByProject.get(projectPath);
      if (projectClients) {
        projectClients.delete(ws);
        if (projectClients.size === 0) {
          this.clientsByProject.delete(projectPath);
          // Stop watching when no more clients
          this.stopWatching(projectPath);
        }
      }
    }
  }

  private startWatching(projectPath: string): void {
    // Already watching
    if (this.fileWatchers.has(projectPath)) {
      return;
    }

    const beadsPath = `${projectPath}/.beads`;
    if (!existsSync(beadsPath)) {
      console.log(`Beads directory not found: ${beadsPath}`);
      return;
    }

    // Watch the entire .beads directory for any changes
    // This catches issues.jsonl, beads.db, beads.db-wal, deletions.jsonl, etc.
    console.log(`Setting up watcher for directory: ${beadsPath}`);

    const watcher = chokidar.watch(beadsPath, {
      ignoreInitial: true,
      persistent: true,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
      ignored: [
        // Ignore Unix socket files
        /\.sock$/,
        // Ignore lock files
        /\.lock$/,
        // Ignore PID files
        /\.pid$/,
        // Ignore daemon log
        /daemon\.log$/,
      ],
    });

    watcher.on('ready', () => {
      console.log(`Watcher ready for ${projectPath}`);
    });

    watcher.on('all', (event, path) => {
      // Only care about changes to data files
      const filename = path.split('/').pop();
      const isDataFile = filename && (
        filename === 'issues.jsonl' ||
        filename === 'beads.db' ||
        filename === 'beads.db-wal' ||
        filename === 'beads.db-shm' ||
        filename === 'deletions.jsonl'
      );

      if (isDataFile) {
        console.log(`File ${event}: ${path}`);
        this.handleFileChange(projectPath);
      }
    });

    watcher.on('error', (error) => {
      console.error(`Watcher error for ${projectPath}:`, error);
    });

    this.fileWatchers.set(projectPath, {
      watcher,
      debounceTimer: null,
      clients: new Set(),
    });

    console.log(`Started watching ${projectPath}`);
  }

  private stopWatching(projectPath: string): void {
    const fileWatcher = this.fileWatchers.get(projectPath);
    if (fileWatcher) {
      if (fileWatcher.debounceTimer) {
        clearTimeout(fileWatcher.debounceTimer);
      }
      fileWatcher.watcher.close();
      this.fileWatchers.delete(projectPath);
      console.log(`Stopped watching ${projectPath}`);
    }
  }

  private handleFileChange(projectPath: string): void {
    const fileWatcher = this.fileWatchers.get(projectPath);
    if (!fileWatcher) return;

    // Debounce file changes (wait 300ms after last change)
    if (fileWatcher.debounceTimer) {
      clearTimeout(fileWatcher.debounceTimer);
    }

    fileWatcher.debounceTimer = setTimeout(() => {
      console.log(`Broadcasting update for ${projectPath}`);
      this.broadcast(projectPath, {
        type: 'beads-update',
        projectPath,
        timestamp: new Date().toISOString(),
      });
      fileWatcher.debounceTimer = null;
    }, 300);
  }

  broadcast(projectPath: string, message: object): void {
    const clients = this.clientsByProject.get(projectPath);
    if (!clients) return;

    const data = JSON.stringify(message);

    for (const ws of clients) {
      try {
        ws.send(data);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        this.removeClient(ws);
      }
    }
  }

  getProjectClientCount(projectPath: string): number {
    const clients = this.clientsByProject.get(projectPath);
    return clients ? clients.size : 0;
  }

  getTotalClientCount(): number {
    return this.clients.size;
  }

  cleanup(): void {
    for (const [projectPath] of this.fileWatchers) {
      this.stopWatching(projectPath);
    }
    this.clients.clear();
    this.clientsByProject.clear();
  }
}

// Singleton instance
export const watcherManager = new WatcherManager();
