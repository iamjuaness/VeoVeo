# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.0.0] - 2025-11-19
### Changed - Major Architecture Refactor
- **Monorepo Migration**: Migrated entire project to pnpm monorepo structure
- **Package Structure**: Split into 3 independent packages:
  - `@veoveo/shared`: Shared TypeScript types and constants
  - `@veoveo/server`: Backend Express.js API with MongoDB
  - `@veoveo/web`: Frontend React + Vite application
- **Feature-Based Architecture**: Reorganized both backend and frontend by features instead of file types
  - Backend: `features/auth`, `features/users`, `features/movies`, `core/`
  - Frontend: `features/auth`, `features/movies`, `features/stats`, `shared/`, `core/`
- **Build System**: Updated to use pnpm workspaces with workspace dependencies (`workspace:*`)
- **Configuration**: Updated `vercel.json` and `.gitignore` for monorepo structure

### Added
- Root-level monorepo scripts: `dev`, `build`, `type-check` for all packages
- Shared package with reusable types exported from single entry point
- Feature-scoped directories for better code organization and maintainability

### Technical Improvements
- Better separation of concerns with layered architecture
- Improved developer experience with hot reload across packages
- Enhanced scalability for future features
- Centralized type definitions reducing duplication

## [1.3.0] - 2025-07-24
### Changed
- Improved UI/UX for mobile devices.
- Improved error handling and user experience.

## [1.2.0] - 2025-07-23
### Added
- Support for dark mode.
- Hamburger menu button on mobile devices.

## [1.1.0] - 2025-07-19
### Changed
- Decoupling of components for better code cleanliness.