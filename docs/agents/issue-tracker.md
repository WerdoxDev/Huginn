# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `WerdoxDev/Huginn`. Use the `gh` CLI.

## Conventions

- Before the first issue creation in a session, verify the target with `gh repo view --json nameWithOwner`. If it differs from `WerdoxDev/Huginn`, resolve the discrepancy with the user.
- Create: `gh issue create --title "..." --body-file <file>`. Use a temporary file for multiline bodies.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,body,labels,comments`, with appropriate filters.
- Update body: `gh issue edit <number> --body-file <file>`.
- Comment: `gh issue comment <number> --body-file <file>`.
- Apply/remove labels: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`. Use the mapping in `docs/agents/triage-labels.md`.
- Close: post an explanation with `gh issue comment`, then run `gh issue close <number>`.

## Parent issues and blockers

- Create a child: `gh issue create --parent <parent> ...`.
- Link an existing child: `gh issue edit <parent> --add-sub-issue <child>`.
- Add a blocker: `gh issue edit <child> --add-blocked-by <blocker>`.
- Count open blockers: `gh api repos/WerdoxDev/Huginn/issues/<number> --jq .issue_dependencies_summary.blocked_by`.
- If native relationships are unavailable, use `Part of #<parent>` and `Blocked by: #<number>` lines in the child body, plus a task list in the parent.
- An issue is unblocked when every blocker is closed.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Skill operations

When a skill says “publish to the issue tracker”, create a GitHub issue.
When it says “fetch the relevant ticket”, read the GitHub issue.

## Wayfinding operations

- Map: one issue labelled `wayfinder:map`, containing Notes, Decisions-so-far, and Fog.
- Child: a sub-issue labelled `wayfinder:<type>` (`research`, `prototype`, `grilling`, or `task`).
- Frontier: the first open child in map order with no assignee and no open blockers.
- Claim: `gh issue edit <number> --add-assignee @me`.
- Resolve: comment with the result, close the child, and append a concise finding and link to the map's Decisions-so-far.
