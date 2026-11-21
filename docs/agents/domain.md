# Domain docs

## Before exploring

This repo uses a single domain context across its packages.

- Read the root `GLOSSARY.md`.
- Read decisions in root `docs/adr/` relevant to the area being explored.

If either is absent, proceed silently. Domain documentation is created lazily through `/domain-modeling` when terms or decisions are resolved.

## Layout

- `GLOSSARY.md`: shared domain vocabulary.
- `docs/adr/`: architecture decision records, named `NNNN-short-title.md`.

## Vocabulary

Use glossary terms in issue titles, proposals, hypotheses, tests, and code. Respect explicitly avoided synonyms.

If a needed concept is missing, reconsider the wording or note the gap for `/domain-modeling`.

## ADR conflicts

Explicitly identify any existing ADR contradicted by a proposal, and explain why the decision should be reconsidered.
