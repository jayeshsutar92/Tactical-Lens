# PressLens Project-Wide Agent Instructions

Welcome to **PressLens**, an AI-powered tactical football analysis application. This document is the central operating instruction manual for AI agents and developers working across the entire PressLens repository.

All tasks, features, bug fixes, and refactoring sessions must strictly follow the engineering standards and reusable skills documented here.

---

## 1. Quick Directory Reference

The repository contains two permanent standards directories:

- [`.agents/`](file:///d:/Personal%20Project/PressLens/.agents): Project-wide engineering guidelines, AI agent standards, git conventions, and verification workflows.
  - [`engineering-standards.md`](file:///d:/Personal%20Project/PressLens/.agents/engineering-standards.md): 10 mandatory engineering rules (no browser, zero ESLint errors, clean code, type safety, security, etc.).
  - [`ai-agent-standards.md`](file:///d:/Personal%20Project/PressLens/.agents/ai-agent-standards.md): FDE principles, prompt engineering, structured schemas, LLM failure handling, and domain grounding.
  - [`git-conventions.md`](file:///d:/Personal%20Project/PressLens/.agents/git-conventions.md): Conventional Commits standard and author identity (`Jay <jayeshsutar312@gmail.com>`).
  - [`execution-workflow.md`](file:///d:/Personal%20Project/PressLens/.agents/execution-workflow.md): Four-phase task execution and verification process.
- [`.skills/`](file:///d:/Personal%20Project/PressLens/.skills): Reusable, procedural workflows for routine development tasks.
  - [`code-quality/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/code-quality/SKILL.md): ESLint, TypeScript, and Python code quality procedures.
  - [`tactical-analysis-ai/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/tactical-analysis-ai/SKILL.md): AI agent design, prompt templating, structured I/O, and domain grounding.
  - [`verification-runner/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/verification-runner/SKILL.md): Automated verification checklist and commands.
  - [`git-commits/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/git-commits/SKILL.md): Conventional commit workflows and author identity validation.

---

## 2. Mandatory Core Rules Summary

Every agent session must actively enforce these core requirements:

<!-- 1. **No Browser Without Permission:** (Commented out per user instruction for end-to-end testing) -->
2. **Zero ESLint Errors:** Always run frontend linting (`npm run lint` in `frontend/`) and eliminate all errors. Never bypass via `eslint-disable`.
3. **Clean, Readable, Modular Code:** Favor simplicity over unnecessary abstractions. No duplicate logic or speculative architectures.
4. **Strict Type Safety:** Use TypeScript properly in the frontend (no unnecessary `any`) and Python type hints with Pydantic in the backend.
5. **Robust Error Handling & Security:** Validate external inputs, handle failures gracefully, and never hardcode API keys or secrets. Keep `.env.example` updated.
6. **Domain Grounding:** In tactical analysis features, ground all conclusions in established football theory. Never hallucinate match statistics or tactical facts.
7. **Conventional Commits & Identity:** All commits must use `Jay <jayeshsutar312@gmail.com>` with standard prefixes (`feat:`, `fix:`, `chore:`, etc.).
8. **Truthful Verification:** Inspect existing code first, implement the smallest maintainable change, verify thoroughly, and never claim a check passed if it was not run.

---

## 3. Technology Stack Reference

- **Backend:** Python 3.13+, FastAPI, Pydantic, Groq AI SDK, MongoDB (via pymongo / motor).
- **Frontend:** React 19, TypeScript (~5.9), Vite (~8.3), ESLint 10, Tailwind CSS / Lucide React.
- **Agent Workflows:** LLM-assisted tactical analysis, structured JSON outputs, pitch coordinates modeling, event-driven pressing analytics.

