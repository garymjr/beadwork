# beadwork

A monorepo for the beadwork project - an issue tracking and project management tool.

## Structure

```
beadwork/
├── packages/
│   ├── ui/          # Frontend UI application
│   └── server/      # Backend API server
└── package.json     # Root package.json
```

## Packages

### `@beadwork/ui`

The main frontend application built with React, Vite, and TanStack Start.

### `@beadwork/server`

Backend API server built with Bun and Hono. Provides endpoints for:
- Bead (issue) CRUD operations
- Project management
- AI-powered title generation and planning via OpenCode
- Filesystem navigation

## Getting Started

```bash
# Install dependencies
bun install

# Run both UI and server
bun run dev:all

# Or run individually
bun run dev          # UI only (port 3000)
bun run dev:server   # Server only (port 3001)
```

## Development

Each package can be developed independently:

```bash
# From the root
bun run --filter @beadwork/ui dev
bun run --filter @beadwork/server dev

# Or from within the package directory
cd packages/ui
bun run dev
```

## API Documentation

See [packages/server/README.md](./packages/server/README.md) for full API documentation.

## Adding a new package

1. Create a new directory in `packages/`
2. Add a `package.json` with a scoped name (e.g., `@beadwork/package-name`)
3. Run `bun install` from the root to link the workspace
