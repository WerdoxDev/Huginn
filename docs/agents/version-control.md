# Version control

## GitButler

Use GitButler's `but` command for branch operations, creating and editing commits, and syncing with remotes. Keep GitButler in control of the workspace; reserve `git` for read-only inspection such as `git log` and `git blame`. If `but` is unavailable or fails, report the problem before attempting another tool to change version-control state.

Before a mutation, inspect `but status --json` and the relevant diff to identify the target branch and changes. Use `but <command> --help` for the installed command's syntax.

`but commit` includes all uncommitted changes by default. Always select the intended file or hunk IDs explicitly and target the intended branch with `--branch`. Get fresh IDs from `but status --json`; use GitButler's diff output when selecting individual hunks. Preserve existing work outside that selection.

After a mutation, inspect the resulting commit or branch and workspace status. Confirm that only the intended changes moved and that unrelated pending changes remain intact.

## Commit boundaries

Each commit contains one coherent change in one monorepo project. Treat each directory directly under `packages/` as a separate project.

- Split changes to different projects into separate commits, even when they implement the same feature or resolve the same issue. For example, shared types, server handling, and app UI belong in three commits.
- Order dependent commits with the shared contract or provider first, followed by its consumers. Explain the dependency in the commit body when needed.
- Keep a project's implementation, regression tests, and project-specific documentation together when they describe the same change. Split unrelated fixes within a project into separate commits.
- Give repository-wide tooling and agent documentation their own commits. Include necessary root metadata, such as a lockfile update, with the project change that requires it; select only the relevant hunks when several projects changed it.

Before committing, account for every selected file or hunk: it must belong to the named project and serve the commit's stated purpose, or be necessary root metadata for that change.

## Commit wording

Use scoped Conventional Commits:

```text
<type>(<scope>): <summary>
```

- Choose the type by intent: `feat` for new behavior, `fix` for a correction, `refactor` for restructuring that preserves behavior, `docs` for documentation, `test` for tests, and `chore`, `build`, or `ci` for maintenance, build tooling, or automation.
- Name the project in the scope, dropping its `huginn-` prefix: `app`, `server`, `shared`, `backend-shared`, `website`, or `native-addon`, for example. Use `repo` for repository-wide changes.
- Start the summary with a lowercase imperative verb: `preserve`, `add`, `remove`, or `centralize`. Describe the concrete behavior or responsibility changed. Keep it concise and omit the trailing period.
- Replace vague summaries such as `fix bugs`, `update files`, or `various improvements` with the specific outcome. If the summary needs to list independent changes, split the commit.
- Append `(#123)` when there is a known related issue, using its actual number. Omit the suffix when no issue is associated.
- Add a body after a blank line when the reason, constraint, or dependency needs explanation. Explain why the change is needed and any material compatibility effect.
- Mark a breaking change with `!` before the colon and explain the required migration in a `BREAKING CHANGE:` footer.

Examples of separate project commits:

```text
feat(shared): define expression collection events
feat(server): emit expression collection events
fix(app): reconcile expression collection events
docs(repo): document agent version control conventions
```
