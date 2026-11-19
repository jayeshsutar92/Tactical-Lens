# Task Execution and Verification Workflow for PressLens

Every coding task and agent interaction in the PressLens repository must follow this disciplined four-step execution and verification lifecycle.

---

## Phase 1: Pre-Implementation Planning

Before writing or modifying any code:

1. **Understand the Requested Change:**
   - Clarify requirements and acceptance criteria.
   - Confirm domain context (tactical football logic vs. application infrastructure).

2. **Inspect Relevant Existing Files & Architecture:**
   - Locate and review existing components, routes, models, or utilities.
   - Understand data flow and architectural patterns already established in the codebase.
   - Do not assume file locations or API contracts without reading the code.

3. **Identify Dependencies and Potential Side Effects:**
   - Determine how changes will affect upstream and downstream callers.
   - Check TypeScript interfaces, Pydantic schemas, and API contracts.
   - Ensure changes do not break existing features or introduce architectural churn.

4. **Design the Smallest Maintainable Solution:**
   - Implement only what is required to fulfill the task.
   - Avoid speculative features, redundant abstractions, or extra third-party dependencies.

---

## Phase 2: Implementation

- Follow the [Mandatory Engineering Standards](file:///d:/Personal%20Project/PressLens/.agents/engineering-standards.md).
- Follow the [AI Agent Standards](file:///d:/Personal%20Project/PressLens/.agents/ai-agent-standards.md) when developing AI features.
- Keep changes scoped strictly to the affected files.
- Preserve existing comments, docstrings, and established code style.

---

## Phase 3: Post-Implementation Verification

After modifying code, run all applicable verification checks:

1. **Frontend Linting:**
   - Run ESLint:
     ```bash
     cd frontend
     npm run lint
     ```
   - Must achieve **zero errors**. Fix any newly introduced warnings or errors before completion.

2. **Frontend Type Checking:**
   - Run TypeScript type checking:
     ```bash
     cd frontend
     npx tsc --noEmit
     ```
   - Resolve any type mismatches, untyped definitions, or missing properties.

3. **Backend Validation:**
   - Verify Python syntax and compilation:
     ```bash
     backend\.venv\Scripts\python.exe -m py_compile backend\app\main.py
     ```
   - Run backend type checking or linting (e.g., `mypy`, `ruff`, or `pytest`) where configured.

4. **Test Execution:**
   - Run existing unit, integration, and scenario tests where available.
   - Ensure all tests pass.

> **Absolute Verification Rule:** Never claim a check passed if it was not executed successfully. If a check could not be run due to an environment constraint or missing service, explicitly disclose this.

---

## Phase 4: Structured Reporting

Every task completion report must include:

1. **What Changed:** High-level summary of the implementation and reasoning.
2. **Files Affected:** Complete list of files created, modified, or removed with file links.
3. **Checks Performed:** Exact verification commands executed and their concrete results (e.g., ESLint clean, TypeScript compiler pass, Python compile pass).
4. **Remaining Issues or Blockers:** Transparent disclosure of any edge cases, pending dependencies, or unverified services.

