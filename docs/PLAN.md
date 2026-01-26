# Orchestration Plan: Security & Performance Scan

**Objective:** Conduct a comprehensive audit of the `slice1` codebase to identify security vulnerabilities, performance bottlenecks, and code quality issues.

## Phase 2: Implementation (After Approval)

### 1. Security Audit (Agent: `security-auditor`)
- **Dependency Scan:** Analyze `npm audit` results for high/critical vulnerabilities.
- **Secret Scanning:** Scan codebase for hardcoded keys (AWS, Supabase, secrets) using pattern matching.
- **Endpoint Security:** specific review of `src/lib/api.ts` and Edge Functions for proper authorization checks.

### 2. Performance Audit (Agent: `performance-optimizer`)
- **React Render Analysis:** Review key pages (`InboxPage`, `AppointmentsPage`) for `useEffect` abuse or expensive inline computations.
- **Bundle Prevention:** Check imports in `App.tsx` and layouts to ensure lazy loading is used where appropriate.
- **Asset Review:** Check for large unoptimized media in `public/`.

### 3. Code Quality & Integration (Agent: `test-engineer`)
- **Linting:** Run `npm run lint` to catch static issues.
- **Type Safety:** Run `npx tsc --noEmit` to verify type integrity (especially after recent refactors).
- **Dead Code:** Final sweep for any remaining unused exports.

## Success Criteria
- [ ] No Critical/High CVEs in dependencies.
- [ ] No hardcoded secrets in `src/`.
- [ ] TypeScript compiles with strict mode.
- [ ] List of performance recommendations generated.
