# CineMate Workspace Core

## Project Modules

This project is a monorepo powered by `pnpm` workspaces:
- Frontend Client: Located in `packages/web`, React + TypeScript + Vite. See `mem:web/core`.
- Backend Server: Located in `packages/server`, Express + TypeScript + MongoDB (Mongoose). See `mem:server/core`.
- Shared Package: Located in `packages/shared`, shared types and schemas.

## General Conventions

- Always run commands from the project root using pnpm workspace filtering or within the target package.
- Respect environment variables defined in `.env` files in both `packages/web` and `packages/server`.
- For file editing, follow standard lint rules and preserve existing comments.
