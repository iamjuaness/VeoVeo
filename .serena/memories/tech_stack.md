# CineMate Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend (`packages/web`)**:
  - React 18, Vite, TypeScript
  - Styling: Vanilla CSS, Tailwind CSS (optional/minimal)
  - State & Data Fetching: TanStack Query (React Query) v5
  - API Client: custom `apiClient` wrapper around `fetch` with token rotation
  - Tests: Vitest, jsdom, React Testing Library
- **Backend (`packages/server`)**:
  - Node.js, Express, TypeScript, Mongoose (MongoDB)
  - Security: bcryptjs, jsonwebtoken, helmet, cors
  - WebSockets: socket.io for real-time synchronization
  - Validation: zod for request payload validation
  - Tests: Vitest (Node), Supertest, `@vitest/coverage-v8`
