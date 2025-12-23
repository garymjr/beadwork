# @beadwork/ui

The frontend UI application for beadwork.

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **TanStack Start** - SSR framework with file-based routing
- **TanStack Router** - Routing and navigation
- **Tailwind CSS v4** - Styling
- **Radix UI** - Component primitives

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── routes/         # File-based routing
├── server/         # Server-side code (API routes, etc.)
├── lib/            # Utility functions
├── data/           # Static data or mocks
├── router.tsx      # Router configuration
└── styles.css      # Global styles
```

## Routing

This project uses TanStack Start's file-based routing system. Routes are defined in the `src/routes/` directory:

- `src/routes/index.tsx` → `/`
- `src/routes/about.tsx` → `/about`
- `src/routes/users.$userId.tsx` → `/users/:userId`

See [TanStack Router documentation](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing) for more details.
