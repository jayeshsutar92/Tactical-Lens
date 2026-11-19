---
name: verification-runner
description: Automated verification runbook for running frontend ESLint, TypeScript checks, backend validation, and producing structured completion reports.
---

# Verification Runner Skill

Use this runbook to execute the mandatory post-implementation verification checks before marking any task as complete.

---

## 1. Verification Sequence

Execute the following checks in order:

### Step 1: Frontend ESLint Check
```bash
cd frontend
npm run lint
```
- **Target:** 0 errors, 0 warnings.
- **Fail condition:** Any exit code other than 0. Fix all reported errors before proceeding.

### Step 2: Frontend TypeScript Compiler Check
```bash
cd frontend
npx tsc --noEmit
```
- **Target:** Clean compilation with zero type errors.
- **Fail condition:** Missing types, implicit any, or broken imports.

### Step 3: Backend Python Validation
```powershell
backend\.venv\Scripts\python.exe -m py_compile backend\app\main.py
```
- **Target:** Clean compilation of all modified Python files without SyntaxErrors.
- If unit/integration tests exist:
  ```powershell
  backend\.venv\Scripts\pytest
  ```

---

## 2. Prohibited Behaviors

- **Never claim a check passed if it was not run.**
- **Never claim a service works without verification.**
- **Never open a browser to check a UI unless explicitly ordered by the user.**
- **Never suppress errors with ignore flags.**

---

## 3. Reporting Template

Always provide a concise, structured report at the end of the task using this format:

```markdown
### Summary of Changes
- <concise bullet point 1>
- <concise bullet point 2>

### Affected Files
- [`path/to/file1.ts`](file:///d:/Personal%20Project/PressLens/path/to/file1.ts) - <short description>
- [`path/to/file2.py`](file:///d:/Personal%20Project/PressLens/path/to/file2.py) - <short description>

### Verification Results
| Check | Command | Result |
| :--- | :--- | :--- |
| Frontend ESLint | `npm run lint` | Pass (0 errors) |
| Frontend TypeScript | `npx tsc --noEmit` | Pass (0 errors) |
| Backend Python Syntax | `python -m py_compile ...` | Pass (Clean compilation) |
| Tests | `<test command>` | Pass / Not configured |

### Disclosures & Next Steps
- <Any unverified external services, environment limitations, or remaining work>
```

