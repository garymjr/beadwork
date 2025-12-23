const API_BASE = 'http://localhost:3001';

// Types
export interface Bead {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: number;
  issue_type?: string;
  created_at?: string;
  updated_at?: string;
  dependency_count?: number;
  dependent_count?: number;
}

export interface TransientBead {
  transientId: string;
  description?: string;
  status: 'generating' | 'error' | 'completed';
  title?: string;
  error?: string;
  retryCount?: number;
  priority?: number;
  issue_type?: string;
  created_at?: string;
  realId?: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface Dependency {
  id: string;
  title: string;
  status: string;
  type: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
}

export interface DirectoryListing {
  currentPath: string;
  parentPath: string | null;
  entries: {
    name: string;
    path: string;
    isDirectory: boolean;
  }[];
}

// Helper function for API calls
async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}

// Beads API
export async function getBeads(projectPath: string): Promise<Bead[]> {
  return apiFetch(`/api/beads?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function getBead(id: string, projectPath: string): Promise<Bead | null> {
  return apiFetch(`/api/beads/${id}?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function createBead(data: {
  projectPath: string;
  title?: string;
  description?: string;
  type?: string;
}): Promise<{ success: boolean; id?: string }> {
  return apiFetch('/api/beads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createBeadAsync(data: {
  projectPath: string;
  description?: string;
  type?: string;
  priority?: number;
  transientId?: string;
}): Promise<Bead & { transientId?: string }> {
  return apiFetch('/api/beads/async', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBead(data: {
  projectPath: string;
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
}): Promise<{ success: boolean }> {
  return apiFetch(`/api/beads/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateBeadTitle(projectPath: string, id: string, title: string): Promise<{ success: boolean; title: string }> {
  return updateBead({ projectPath, id, title });
}

export async function deleteBead(projectPath: string, id: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/beads/${id}?projectPath=${encodeURIComponent(projectPath)}`, {
    method: 'DELETE',
  });
}

export async function getComments(projectPath: string, id: string): Promise<Comment[]> {
  return apiFetch(`/api/beads/${id}/comments?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function addComment(projectPath: string, id: string, content: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/beads/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ projectPath, content }),
  });
}

export async function getDependencies(projectPath: string, id: string): Promise<Dependency[]> {
  return apiFetch(`/api/beads/${id}/dependencies?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function addDependency(projectPath: string, id: string, dependsOnId: string, type?: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/beads/${id}/dependencies`, {
    method: 'POST',
    body: JSON.stringify({ projectPath, dependsOnId, type }),
  });
}

export async function removeDependency(projectPath: string, id: string, dependsOnId: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/beads/${id}/dependencies/${dependsOnId}?projectPath=${encodeURIComponent(projectPath)}`, {
    method: 'DELETE',
  });
}

export async function generateTitle(description: string, projectPath?: string): Promise<string> {
  const result = await apiFetch('/api/beads/opencode/generate-title', {
    method: 'POST',
    body: JSON.stringify({ description, projectPath }),
  });
  return result.title;
}

export async function getProjectStats(projectPath: string): Promise<any> {
  return apiFetch(`/api/beads/stats?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function createPlan(data: {
  projectPath: string;
  id: string;
  title?: string;
  description?: string;
  issue_type?: string;
}): Promise<{ success: boolean; plan?: any }> {
  return apiFetch(`/api/beads/${data.id}/plan`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Projects API
export async function getProjects(): Promise<Project[]> {
  return apiFetch('/api/projects');
}

export async function getProject(id: string): Promise<Project | null> {
  return apiFetch(`/api/projects/${id}`);
}

export async function addProject(path: string, init?: boolean): Promise<Project> {
  return apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ path, init }),
  });
}

export async function removeProject(id: string): Promise<Project[]> {
  return apiFetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

// Filesystem API
export async function getDirectoryListing(path?: string): Promise<DirectoryListing> {
  const query = path ? `?path=${encodeURIComponent(path)}` : '';
  return apiFetch(`/api/filesystem/directory${query}`);
}

export type {
  Bead,
  TransientBead,
  Comment,
  Dependency,
  Project,
  DirectoryListing,
};
