---
description: Generate a HANDOFF.md snapshot of the current session so a new chat can resume without losing context
---

# Handoff

Generate a `HANDOFF.md` file in the project root that captures the state of the current session.

## Steps

1. Run `git log --oneline -10` to see recent commits
2. Run `git status` to capture any uncommitted changes
3. Run `git diff HEAD` to see unstaged work if any
4. Synthesize the conversation history and git state into the handoff doc

## Output format

Write the file to `/Users/noya/Downloads/Personal/Personal Projects/WeddingPlanner/HANDOFF.md` using this structure:

```markdown
# Handoff — <date>

## What we did this session
<bullet list of the main things built, changed, or decided>

## Current state
- Branch: <branch name>
- Uncommitted changes: <yes/no — list files if yes>
- Last commit: <hash and message>

## Decisions made
<bullet list of non-obvious choices made and why — skip obvious ones>

## Unfinished / next steps
<what was left incomplete or what the natural next action is>

## How to resume
<one short paragraph telling the next session exactly where to pick up>
```

## Notes

- Be specific — vague bullets like "worked on the app" are useless
- If nothing is unfinished, say so explicitly
- `HANDOFF.md` is gitignored and local only
