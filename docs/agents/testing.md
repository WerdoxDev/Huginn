# Testing rules

- In `packages/huginn-app`, use Vitest for tests. Playwright is permitted only for smoke tests and tests that require actual browser interaction.
- Aim for confidence in meaningful behavior and regressions, not 100% coverage.
- Test modules as a whole through their public interfaces, asserting observable behavior. Internal changes that preserve behavior should leave tests passing.
