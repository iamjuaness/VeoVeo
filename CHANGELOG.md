# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.1.1] - 2025-11-20

### Added

- **Watched Movies Sorting**: Added chronological sorting (newest/oldest) for watched movies tab
  - New sort selector in watched movies view
  - Sort by last watched date (ascending or descending)
  - Maintains sort order across filters and pagination
- **Enhanced Movie Context**: Extended `MoviesContext` with filter state management
  - Added `filterStatus` and `setFilterStatus` to context
  - Improved state sharing between components
  - Better separation of concerns for filter logic

### Changed

- **Watched Movies Display**: Improved watched movies list rendering
  - Separate pagination logic for watched movies
  - Global sorting applied before pagination
  - Preserves `watchedAt` timestamps and `duration` data in movie merging
- **Infinite Scroll**: Optimized scroll behavior for different filter states
  - Disabled automatic loading when not in "all" tab
  - Prevents unnecessary API calls on filtered views
  - Better performance for watched and watch later lists

### Fixed

- **Timezone Handling**: Fixed timestamp storage to use user's local timezone
  - Corrected `watchedAt` date calculation in `MovieTracker.tsx`
  - Corrected `watchedAt` date calculation in `MovieDetailPage.tsx`
  - Ensures accurate date display across different timezones
- **Filter State Reset**: Fixed pagination reset when changing filters
  - Reset to page 1 when switching between tabs
  - Reset when changing sort order, genres, or ratings
  - Prevents showing empty results after filter changes
- **TypeScript Type Error**: Fixed type mismatch in calendar heatmap tooltips
  - Added type assertions to `tooltipDataAttrs` in `StatsPage.tsx`
  - Resolved incompatibility with `react-calendar-heatmap` type definitions

### Technical Improvements

- Refactored watched movies filtering logic for better maintainability
- Improved state management with `useEffect` dependencies
- Better code organization in `MovieTracker.tsx` component
- Code formatting improvements across multiple files

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
