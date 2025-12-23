# @beadwork/server

The backend API server for beadwork.

## Tech Stack

- **Bun** - JavaScript runtime
- **Hono** - Fast, lightweight web framework
- **OpenCode SDK** - AI-powered code analysis
- **Zod** - Schema validation

## Development

```bash
# Install dependencies (from root)
bun install

# Start dev server
bun run dev

# Start on custom port
PORT=3002 bun run dev

# Build for production
bun run build

# Start production server
bun start
```

## API Endpoints

### Root

- `GET /` - API information and available endpoints
- `GET /health` - Health check

### Beads (`/api/beads`)

All bead endpoints require a `projectPath` query parameter or in the request body.

- `GET /api/beads?projectPath=<path>` - List all beads
- `GET /api/beads/:id?projectPath=<path>` - Get a single bead
- `POST /api/beads` - Create a new bead
  ```json
  {
    "projectPath": "/path/to/project",
    "title": "Issue title",
    "description": "Issue description",
    "type": "bug|feature|task"
  }
  ```
- `POST /api/beads/async` - Create a bead asynchronously with placeholder title
- `PUT /api/beads/:id` - Update a bead
  ```json
  {
    "projectPath": "/path/to/project",
    "title": "New title",
    "description": "New description",
    "status": "open|in_progress|closed",
    "priority": 0-4
  }
  ```
- `DELETE /api/beads/:id?projectPath=<path>` - Delete a bead

### Bead Comments (`/api/beads/:id/comments`)

- `GET /api/beads/:id/comments?projectPath=<path>` - Get comments for a bead
- `POST /api/beads/:id/comments` - Add a comment
  ```json
  {
    "projectPath": "/path/to/project",
    "content": "Comment text"
  }
  ```

### Bead Dependencies (`/api/beads/:id/dependencies`)

- `GET /api/beads/:id/dependencies?projectPath=<path>` - Get dependencies
- `POST /api/beads/:id/dependencies` - Add a dependency
  ```json
  {
    "projectPath": "/path/to/project",
    "dependsOnId": "bd-123",
    "type": "blocks|depends_on"
  }
  ```
- `DELETE /api/beads/:id/dependencies/:dependsOnId?projectPath=<path>` - Remove dependency

### Bead Plans (`/api/beads/:id/plan`)

- `POST /api/beads/:id/plan` - Create an AI-generated plan with subtasks
  ```json
  {
    "projectPath": "/path/to/project",
    "title": "Issue title",
    "description": "Issue description",
    "issue_type": "bug|feature|task"
  }
  ```

### OpenCode (`/api/beads/opencode`)

- `POST /api/beads/opencode/generate-title` - Generate a title from description
  ```json
  {
    "description": "Issue description",
    "projectPath": "/path/to/project"
  }
  ```

### Project Stats (`/api/beads/stats`)

- `GET /api/beads/stats?projectPath=<path>` - Get project statistics

### Projects (`/api/projects`)

- `GET /api/projects` - Get all saved projects
- `GET /api/projects/:id` - Get a single project
- `POST /api/projects` - Add a new project
  ```json
  {
    "path": "/path/to/project",
    "init": false  // Set to true to run 'bd init'
  }
  ```
- `DELETE /api/projects/:id` - Remove a project

### Filesystem (`/api/filesystem`)

- `GET /api/filesystem/directory?path=<path>` - List directory contents (directories only)

## Environment Variables

- `PORT` - Server port (default: 3001)

## Project Structure

```
src/
├── index.ts           # Entry point
├── routes/
│   ├── beads.ts       # Bead-related endpoints
│   ├── projects.ts    # Project management endpoints
│   └── filesystem.ts  # Filesystem navigation endpoints
└── utils/
    ├── beads.ts       # bd command utilities
    ├── opencode.ts    # OpenCode SDK integration
    ├── projects.ts    # Project data management
    └── filesystem.ts  # Filesystem utilities
```

## CORS

The server accepts requests from:
- `http://localhost:3000` (default UI port)
- `http://localhost:3001` (alternative UI port)
