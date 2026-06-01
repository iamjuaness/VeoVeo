# CineMate Task Completion

Before completing any task, ensure the following checklist is met:
1. All newly introduced code passes ESLint.
2. All backend tests pass with `pnpm --filter @veoveo/server test`.
3. All frontend tests pass with `pnpm --filter @veoveo/web test`.
4. Code coverage in the server is above 70% as measured by `pnpm --filter @veoveo/server test -- --coverage`.
5. No credentials or secret keys are committed.
