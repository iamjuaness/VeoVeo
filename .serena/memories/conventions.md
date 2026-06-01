# CineMate Conventions

## Backend (Express)
- Routers use `.routes.ts` naming. Controller logic is split into `.controller.ts`.
- Mongoose models are stored in separate files like `user.model.ts`, exported as default.
- Validation is performed using Zod schemas via `validate(schema)` middleware.
- Authentication uses JWTs via `authMiddleware` that checks the Authorization header.

## Frontend (React)
- State management and API calling utilize TanStack Query (`useQuery`, `useMutation`).
- Providers and Contexts are used to share dynamic state (like `AuthContext`, `MoviesContext`, `SeriesContext`).
- API requests use a central `apiClient` to automatically handle auth and token rotation.
