---
name: code-quality
description: Enforce zero ESLint errors, strict TypeScript safety, and backend Python standards across PressLens.
---

# Code Quality & Linting Skill

This skill provides step-by-step procedures to maintain code quality, eliminate lint errors, and ensure type safety across the frontend and backend.

---

## 1. Frontend ESLint Verification (Zero Errors)

PressLens requires zero ESLint errors in the frontend at all times.

### Execution Procedure
From the repository root or `frontend/` directory:

```bash
cd frontend
npm run lint
```

### Remediation Rules
- **No rule suppression:** Never use `/* eslint-disable */` or `// @ts-ignore` to silence errors unless an explicit, documented architectural exception was pre-approved.
- **Unused variables:** Remove unused imports and variables, or prefix intentionally unused arguments with `_` if supported by the rule configuration.
- **React Hooks:** Strictly follow the Rules of Hooks. Ensure dependency arrays for `useEffect`, `useCallback`, and `useMemo` are complete and exhaustive.
- **Component exports:** Maintain proper component naming and React Fast Refresh compatibility.

---

## 2. Frontend TypeScript Type Checking

TypeScript must compile cleanly without implicit types or regressions.

### Execution Procedure
```bash
cd frontend
npx tsc --noEmit
```

### Guidelines
- Avoid `any`. If a payload structure is unknown, define an explicit interface or use `unknown` with runtime type narrowing (e.g., Zod schemas).
- Define shared interfaces for domain entities (e.g., `MatchTactics`, `PressingEvent`, `PitchZone`, `PlayerCoordinate`).
- Props interfaces must clearly distinguish required vs. optional fields (`?`).

---

## 3. Backend Python Code Quality

Ensure Python code complies with PEP 8 and FastAPI best practices.

### Execution Procedure
```powershell
backend\.venv\Scripts\python.exe -m py_compile backend\app\main.py
```

### Guidelines
- Use explicit type annotations for all function signatures and return types.
- Use Pydantic `BaseModel` for request and response payloads.
- Keep FastAPI path operation functions lean; delegate complex tactical analysis logic to dedicated service modules.

