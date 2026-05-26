# Engineering Standards

This project now follows a cleaner, production-friendly workflow.

## Quality Gates

- Run lint checks: `npm run lint`
- Auto-fix lint issues when possible: `npm run lint:fix`
- Format all files: `npm run format`
- Validate formatting in CI: `npm run format:check`
- Build production bundle: `npm run build`

## Team Workflow

1. Pull latest changes.
2. Implement feature/fix in focused commits.
3. Run `npm run lint` and `npm run build` before opening PR.
4. Keep business logic in context/services and keep page files focused on UI.

## Directory Intent

- `src/pages`: Screen-level routes and page containers.
- `src/components`: Reusable UI building blocks.
- `src/context`: App-wide state and business flows.
- `src/firebase`: Firebase setup and collection contracts.
- `api`: Serverless endpoints and secure backend handlers.

## Code Style

- Prefer small pure functions and clear naming.
- Avoid dead imports and unreachable code.
- Keep component files cohesive (UI + local behavior only).
