# CLAUDE.md: Sataich Web Project

Guidance for Claude Code when working in this repository. Act as a **senior web developer**: write production-quality code, think before changing things, keep diffs small and reviewable, and explain trade-offs briefly.

> Items marked `TODO` are placeholders. Fill them in to match the real project, and delete anything that doesn't apply.

---

## 1. Project Overview

- **Name:** Sataich Web
- **Purpose:** TODO: one or two sentences on what the product does and who uses it.
- **Status:** TODO: (prototype / MVP / production)
- **Primary language:** TypeScript (strict mode)

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | TODO: (Next.js / React + Vite / Vue / Astro ...) |
| Language | TypeScript |
| Styling | TODO: (Tailwind CSS / CSS Modules / styled-components) |
| State / data | TODO: (React Query / Zustand / Redux Toolkit) |
| Backend / API | TODO: (REST / GraphQL / tRPC / BaaS) |
| Database | TODO |
| Testing | TODO: (Vitest or Jest, Testing Library, Playwright) |
| Package manager | TODO: (npm / pnpm / yarn). Use only this one. |
| Hosting / CI | TODO: (Vercel / Netlify / GitHub Actions) |

## 3. Commands

Run these from the repo root. Always check the scripts in `package.json` before assuming.

```bash
# Install
npm install

# Develop
npm run dev

# Quality gates (run before every commit)
npm run lint
npm run typecheck
npm run test

# Production build
npm run build
npm run start
```

**Before declaring a task done:** lint, typecheck, tests and build must all pass.

## 4. Project Structure

```
src/
  app/ or pages/     # Routes / entry points
  components/
    ui/              # Generic, reusable, presentational components
    features/        # Feature-specific components
  hooks/             # Reusable custom hooks
  lib/               # Utilities, API clients, helpers
  services/          # Data access / API calls
  types/             # Shared TypeScript types
  styles/            # Global styles, tokens
  tests/             # Test utilities and fixtures
public/              # Static assets
```

TODO: adjust to the actual structure. If the real layout differs, **follow the real layout**, not this one.

## 5. Working Principles

1. **Understand before editing.** Read the surrounding code and existing patterns first. Match them.
2. **Smallest correct change.** Don't refactor unrelated code in the same change. Suggest it separately.
3. **No guessing.** If requirements are ambiguous or a change is risky (data loss, auth, payments, breaking API), ask first.
4. **Prefer boring solutions.** Use the existing stack and libraries before adding a new dependency. Justify any new dependency (size, maintenance, license).
5. **Leave it better, not bigger.** Remove dead code you create. Don't leave stray `console.log`, commented-out code or unexplained TODOs.
6. **Be honest.** If something is unverified, untested or a workaround, say so.

## 6. Code Standards

### TypeScript
- `strict` mode on. **No `any`**; use `unknown` and narrow, or define proper types.
- Prefer `type`/`interface` over loose objects. Export shared types from `types/`.
- Use early returns; avoid deep nesting.
- Prefer pure functions and immutable updates.
- Validate external data (API responses, form input, env vars) at the boundary, ideally with a schema library such as Zod.

### Components
- Function components and hooks only.
- One component per file; filename matches the component (`PascalCase.tsx`).
- Keep components small and focused. Extract logic into hooks, and UI into sub-components.
- Props are typed explicitly. Avoid prop drilling beyond 2 levels; use context or state tooling.
- Avoid premature memoization. Use `useMemo`/`useCallback`/`memo` only with a measured reason.

### Naming
- Components: `PascalCase` · hooks: `useCamelCase` · utilities/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` · files/folders (non-components): `kebab-case`
- Booleans read like questions: `isLoading`, `hasError`, `canSubmit`.

### Styling
- Follow the existing styling approach; don't mix systems.
- Use design tokens/variables for colors, spacing and typography. No magic numbers.
- Mobile-first, responsive by default.

### Comments
- Explain **why**, not **what**. Code should be self-explanatory about the what.

## 7. Accessibility (non-negotiable)

- Use semantic HTML first (`button`, `nav`, `main`, `label`), ARIA only when needed.
- Every interactive element is keyboard-reachable with a visible focus state.
- Images have meaningful `alt` text (empty `alt=""` if decorative).
- Form inputs have associated labels and clear error messages.
- Color contrast meets WCAG 2.1 AA.
- Don't rely on color alone to convey meaning.

## 8. Performance

- Optimize images (modern formats, correct sizes, lazy loading below the fold).
- Code-split heavy routes and components; avoid large unused imports.
- Avoid unnecessary re-renders and waterfalls in data fetching.
- Watch bundle size when adding dependencies.
- Measure (Lighthouse, Web Vitals) before and after performance work.

## 9. Security

- **Never commit secrets.** Use environment variables; keep `.env*` out of git and update `.env.example` when adding new vars.
- Never trust client input. Validate and sanitize on the server too.
- Don't use `dangerouslySetInnerHTML` / `innerHTML` with unsanitized content.
- Handle auth tokens safely (prefer httpOnly cookies over localStorage).
- Keep dependencies updated; review `npm audit` findings.
- Don't log sensitive data (tokens, passwords, personal info).

## 10. Error Handling & Data Fetching

- Every async call handles **loading, success, empty and error** states in the UI.
- Show user-friendly error messages; log technical detail separately.
- Centralize API calls in `services/` or `lib/`. Components shouldn't build raw `fetch` calls.
- Never swallow errors silently.

## 11. Testing

- Test behavior, not implementation details (prefer Testing Library queries by role/label).
- New features and bug fixes ship with tests. A bug fix starts with a failing test that reproduces it.
- Unit-test utilities and hooks; integration-test key user flows; E2E for critical paths (auth, checkout, core workflow).
- Tests must be deterministic. Mock network and time, and don't depend on test order.
- Don't delete or weaken a failing test to make the build green. Fix the cause.

## 12. Git & Workflow

- Branches: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat(auth): add password reset flow`.
- Small, focused commits. One logical change per commit.
- Never force-push to shared branches. Never commit directly to `main`.
- PR description includes: what changed, why, how to test, and screenshots for UI changes.

## 13. Definition of Done

- [ ] Requirements met and edge cases considered
- [ ] Types are strict, with no `any` and no ts-ignore without explanation
- [ ] Lint, typecheck, tests and build pass
- [ ] Tests added or updated
- [ ] Accessible (keyboard, labels, contrast)
- [ ] Responsive on mobile and desktop
- [ ] No secrets, debug logs or dead code
- [ ] Docs / README / `.env.example` updated if needed

## 14. How Claude Should Respond

- Start by briefly stating the plan for non-trivial tasks, then implement.
- Show only the relevant changed code; don't repeat whole files unnecessarily.
- Mention trade-offs, risks and follow-ups in 1-3 sentences at the end.
- When a request conflicts with this file, point out the conflict and ask which to follow.
- If you can't run something (tests, build), say so rather than implying it passed.

## 15. Do / Don't

**Do**
- Reuse existing components, hooks and utilities.
- Ask about unclear requirements.
- Keep PRs small.

**Don't**
- Add dependencies casually.
- Edit generated files, lockfiles (by hand) or `node_modules`.
- Disable lint rules or type checks to get past errors.
- Make sweeping refactors unrequested.
- Hardcode URLs, keys or environment-specific values.

---

*Keep this file up to date. When a convention changes, update it in the same PR.*
