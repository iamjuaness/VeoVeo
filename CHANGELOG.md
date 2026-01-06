# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.7.1] - 2026-01-06

### Fixed

- **Badge Synchronization**: "Watched" and "Watch Later" badges now correctly appear in all lists for both Movies and Series.
- **Series Tracker Crash**: Fixed runtime error `s.title.trim is not a function` by adding robust type checks.
- **Scroll Rendering**: Fixed blank spaces during fast scroll by removing conflicting `loading="lazy"` attributes in virtualized lists.
- **Data Consistency**: Fixed issue where "Watched" Series tab was sometimes empty due to sync errors.

### Improved

- **Stats Page**: Updated chart titles for better Spanish localization.
- **Optimistic UI**: Improved loading experience on Movie Details page.

### Technical

- **Database Schema**: Unified Media Cache schema to use `id` field consistently across the application.
- **Context Logic**: Refactored `MoviesContext` and `SeriesContext` to use `useRef` preventing stale state during data synchronization.
- **Aggregation Pipelines**: Corrected MongoDB aggregation lookups to properly match media metadata.

## [2.7.0] - 2026-01-05

### Added

- **Notification Center**: Real-time notification system for friend requests and media recommendations.
- **Improved UX**: New bell icon in the header with unread count badge and pulse animation.
- **Social Integration**: Integrated Notification Center into Movies, Series, and Social pages.
- **Technical UI Refactor**: Implemented `forwardRef` across core UI components (Button, Popover, Avatar, Badge) for better Radix UI compatibility.

### Improved

- **Popover Performance**: Optimized Popover rendering with solid backgrounds and high-priority z-index layering.
- **Infinite Scroll**: Updated `overscan` values to 1600 in Movie and Series trackers for smoother infinite scrolling.

### Backend

- **Notification Persistence**: Added `isRead` flag to friend requests and recommendations in the database.
- **Notification Controllers**: New API endpoints to mark notifications as read.

## [2.6.0] - 2025-12-28

### Added

- **Scroll Independence**: Independent scroll position restoration for Movies and Series sections.
- **Series Feature Parity**: Full `localStorage` persistence and optimized server syncing for Series (Watched, In Progress, Watch Later).

### Improved

- **Scroll Performance**: Removed `GlareHover` and unthrottled scroll listeners to eliminate UI lag.
- **Hardware Acceleration**: Added `will-change-transform` to card components for smoother animations.
- **Bundle Optimization**: Optimized Vite build with manual chunk splitting for heavy dependencies (Recharts, jsPDF).
- **Infinite Scroll Stability**: Implementation of fetch guards to prevent redundant API calls and 429 errors.

### Fixed

- **Memory Overhead**: Reduced DOM complexity and CPU usage by removing expensive mouse-tracking effects.
- **Sync Logic**: Combined disjointed server requests into single status-based synchronization.

## [2.5.0] - 2025-12-10

### Added

- **Series Completion Logic**: Implemented strict "Completed" vs "In Progress" logic. Series are now marked as completed only when all episodes are watched or manually toggled.
- **Automatic Completion**: Series are automatically marked as "Completed" when the last episode is watched.
- **Series Statistics**: Added a new "Series Statistics" section to the Stats page, tracking total watched series, in-progress series, and total episodes watched.
- **Lazy Loading**: Optimized series episode loading. Episodes are now fetched only when expanding a specific season, improving performance.
- **Toggle Series Completion Endpoint**: New backend endpoint `POST /api/user/series/completed` to manually manage series completion status.
- **Socket Real-time Sync**: Added real-time updates for series lists. Marking a series as watched updates all devices instantly.

### Improved

- **Mark All as Watched**: Now correctly marks the series as "Completed" (green badge) in addition to marking all episodes.
- **Series Filtering**: Improved logic to prevent false positives in "Watched" lists. Only fully completed series appear in the "Watched" filter.

## [2.4.0] - 2025-12-03

### Improved

- **ModalLogin**: Redesigned with gradient header, input icons (Mail, Lock), and better error handling
- **ModalRegister**: Enhanced with gradient header, password strength indicator (5 levels), and improved avatar selection UI

## [2.3.0] - 2025-12-03

### Added

- **Slider Navigation**: Click on slider images now navigates to movie details
- **Dynamic Version Display**: App version now uses a constant for easy updates
- **Enhanced Slider**: Added "Ver Detalles" button with play icon

### Improved

- **Slider Content Position**: Repositioned movie info to center for better visibility
- **MovieDetailPage Hero**: Added backdrop image with blur effect for immersive experience
- **Movie Poster**: Increased size (250x375) with hover scale effect and border
- **Action Buttons**: Redesigned with better colors (green for watched, blue for watch later)
- **Info Cards**: Added backdrop blur and enhanced shadows for modern look
- **Filter Buttons**: Fixed text truncation with proper min-width and whitespace handling
- **Search Bar**: Enhanced floating search with animations and better styling
- **User Avatar**: Increased size (12x12) with scale hover effect
- **MovieFilters**: Added icons (Film, Eye, Clock) and badge counters
- **Stats Component**: Redesigned with modern cards and themed icons

### Fixed

- **Slider Navigation Bug**: Fixed issue where clicking always navigated to first movie instead of current slide
- **Filter Text Overflow**: Ensured filter dropdown text displays completely without truncation
- **UserMenu Duplicate**: Removed duplicate Settings button from DialogTrigger

## [2.2.0] - 2025-12-03

### Added

- **Stats Page Visual Overhaul**: Complete redesign of the statistics dashboard for a more professional and engaging look.
  - **New Achievements System**: Added 9 new achievements (Planificador, Coleccionista, Rey del Drama, etc.) with a visual medal grid layout and progress tracking.
  - **Enhanced Charts**:
    - Full-width "Favorite Genres" horizontal bar chart.
    - "Most Watched Movies" grid with poster art and rankings.
    - "Recent Activity" KPI dashboard with key metrics.
    - "Favorite Decades" bar chart.
- **PDF Report Optimization**:
  - Significantly reduced PDF file size using JPEG compression and optimized scaling.
  - Fixed color rendering issues for dark mode themes.

### Changed

- **Chart Modernization**: Replaced legacy scatter/line charts with modern `AreaChart` and `BarChart` components using gradients and consistent styling.
- **Data Accuracy**: Fixed critical bug in duration calculations (seconds vs minutes) ensuring accurate "Rating vs Duration" analysis.
- **UI Refinements**: Improved "Detailed Stats" cards (Percentiles, Diversity, Rewatch Habits) with cleaner layouts, better tooltips, and consistent design language.

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
