---
name: recursion-task
description: Use when starting work on a task from the Recursion project implementation plan. Guides task setup, implementation workflow, Angular conventions, and plan status update.
---

# Recursion Task Execution

Workflow for implementing a task from [docs/superpowers/plans/2026-06-07-recursion-full-implementation.md](docs/superpowers/plans/2026-06-07-recursion-full-implementation.md).

## Step 1: Orient

Read the current task in the plan:
1. Open [the plan](docs/superpowers/plans/2026-06-07-recursion-full-implementation.md)
2. Find the first `- [ ]` task heading — that is your current task
3. Note the **branch name**, **files to create/modify**, and **Готово когда** criteria

If the user specified a task number (e.g. "task 9"), jump directly to it.

## Step 2: Check the spec and Figma

- Read [docs/categories-spec.md](docs/categories-spec.md) if the task involves Categories feature or Auth
- If the task has a **Figma** link → use `mcp__plugin_figma_figma__get_design_context` and `mcp__plugin_figma_figma__get_screenshot` to get the layout before writing any HTML/SCSS
- If the task touches HTTP → check the Swagger at `https://zidium3-backend.zidium.net/swagger/index.html?urls.primaryName=Front`

## Step 3: Implement

Follow [CLAUDE.md](CLAUDE.md) conventions strictly:

**Structure:**
- Pages → `features/<name>/pages/`
- Components → `features/<name>/components/`
- Services → `features/<name>/services/`
- Interfaces → `features/<name>/models/interfaces/` (prefix `I`)
- Core guards/interceptors → `src/app/core/`
- UI primitives → `src/ui-kit/`

**Angular rules:**
- `OnPush` change detection on every component
- `inject()` not constructor injection
- `signal()` / `computed()` for component state — no `Subject`/`BehaviorSubject` in components
- `@if` / `@for` / `@switch` — no `*ngIf` / `*ngFor`
- Standalone components only
- `import type` for type-only imports
- Explicit access modifiers (`public` / `private` / `protected`) on every class member
- `readonly` on properties never reassigned

**HTTP:**
- All HTTP calls go in `*-api.service.ts` — never in components or pages
- Functional interceptors registered in `app.config.ts`

**Testing (TDD — write test first):**
- Write the failing spec before writing implementation
- Run `npm test` to confirm RED
- Implement minimal code to pass
- Run `npm test` to confirm GREEN

## Step 4: Validate

Run all checks before marking done:

```bash
npm run lint        # must pass with 0 errors
npm test            # all specs green
npx tsc --noEmit    # no type errors
```

If the task produces visible UI, run `npm start` and verify in browser:
- Check Chrome DevTools console for errors
- Compare with Figma screenshot

## Step 5: Commit

Stage only the files you changed:

```bash
git add <specific files>
git commit -m "feat: <short description matching task>"
```

## Step 6: Mark task done in the plan

In [docs/superpowers/plans/2026-06-07-recursion-full-implementation.md](docs/superpowers/plans/2026-06-07-recursion-full-implementation.md):

1. Change the task heading from `### [ ]` to `### [x]`
2. Change each `- [ ]` step inside the task to `- [x]`
3. Update the **Прогресс** table at the bottom (increment the "Готово" count for the phase)

```bash
git add docs/superpowers/plans/2026-06-07-recursion-full-implementation.md
git commit -m "docs: mark task N complete in plan"
```

## Quick Reference

| Need | Where to look |
|------|--------------|
| Project conventions | [CLAUDE.md](CLAUDE.md) |
| Feature requirements | [docs/categories-spec.md](docs/categories-spec.md) |
| Full task list | [docs/superpowers/plans/2026-06-07-recursion-full-implementation.md](docs/superpowers/plans/2026-06-07-recursion-full-implementation.md) |
| Backend API | `https://zidium3-backend.zidium.net/swagger/index.html?urls.primaryName=Front` |
| Figma designs | `https://www.figma.com/design/KCYaDH4HaImmOB7ZASq784/Zidium?node-id=1508-21270` |
| Test credentials | `test` / `77777` |
