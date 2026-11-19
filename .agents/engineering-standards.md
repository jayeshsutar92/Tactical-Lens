# Mandatory Engineering Standards for PressLens

These engineering standards are mandatory across the entire PressLens project (both frontend and backend). Every agent, developer, and automated workflow must strictly comply with these rules.

---

<!--
## 1. No Browser Access Without Permission (Restriction commented out per user instruction for end-to-end browser testing)
- **Rule:** Never open Chrome, launch a web browser, navigate to external websites, or run headless browser automation unless explicitly requested.
-->

## 2. Frontend ESLint Zero Errors
- **Rule:** Maintain zero ESLint errors across the frontend at all times.
- **Workflow:**
  - Run `npm run lint` in `frontend/` after making changes to TypeScript/React files.
  - Fix any introduced errors or warnings immediately before declaring a task complete.
  - **No suppressions:** Do not insert `eslint-disable`, `@ts-ignore`, or suppress rules merely to hide or bypass errors. Fix the underlying root cause.

## 3. Clean Code
- **Rule:** Write clean, readable, modular, maintainable, and reusable code across both frontend and backend.
- **Practices:**
  - Follow idiomatic conventions for Python (PEP 8, FastAPI patterns) and TypeScript/React (functional components, custom hooks, atomic components).
  - Use clear, descriptive variable, function, and file names that reflect their domain purpose.
  - Keep functions focused on a single responsibility (Single Responsibility Principle).
  - Colocate related types, utilities, and components where appropriate.

## 4. No Unnecessary Complexity
- **Rule:** Avoid overengineering, duplicate logic, premature optimization, unnecessary abstractions, and redundant dependencies.
- **Practices:**
  - Favor simple, straightforward implementations over speculative design patterns.
  - Do not introduce multi-layer abstractions or generic wrapper classes for simple one-off tasks.
  - Reuse existing utility functions and components rather than re-implementing similar logic.
  - Do not add new external npm or pip packages without explicit justification.

## 5. Type Safety
- **Rule:** Maintain strict type safety across the entire application stack.
  - **Frontend:** Use TypeScript strictly. Avoid `any`, untyped object interfaces, or implicit type coercions. Define explicit interfaces/types for props, API responses, state, and event handlers.
  - **Backend:** Use Python type hints throughout (e.g., `str`, `int`, `list[T]`, `Optional[T]`, `dict[str, Any]` only when strictly dynamic). Use Pydantic models for request bodies, query parameters, and API responses.

## 6. Error Handling & Validation
- **Rule:** Implement robust error handling, defensive input validation, and predictable API responses.
- **Practices:**
  - Validate all incoming API requests on the backend with Pydantic schemas.
  - Handle exceptions gracefully using FastAPI exception handlers and standard HTTP status codes (e.g., 400 for bad input, 404 for not found, 422 for validation, 500 for unexpected errors).
  - On the frontend, handle network failures, loading states, and error responses with clear UI messaging. Never leave the UI stuck in an indefinite loading state.

## 7. Security & Secrets Management
- **Rule:** Never hardcode API keys, credentials, tokens, connection strings, or secrets anywhere in the codebase.
- **Practices:**
  - Access configuration exclusively via environment variables (e.g., `GROQ_API_KEY`, `MONGODB_URL`).
  - Maintain `.env.example` with dummy values for all required environment variables.
  - Ensure `.env` and sensitive files are included in `.gitignore`.
  - Sanitize and validate all external user inputs to prevent injection vulnerabilities.

## 8. Documentation
- **Rule:** Keep documentation accurate, synchronized, and relevant.
- **Practices:**
  - Update `README.md` files when project setup, commands, or architectural components change.
  - Keep `.env.example` in sync whenever new configuration keys are introduced.
  - Document public API endpoints using FastAPI's OpenAPI metadata (`summary`, `description`, `response_model`).
  - Write concise, meaningful docstrings and comments explaining *why* non-obvious logic exists, not just *what* it does.

## 9. Respect Existing Architecture
- **Rule:** Inspect existing code, file conventions, and architectural patterns before modifying them.
- **Practices:**
  - Do not execute unnecessary architectural rewrites or refactors when implementing a feature or bugfix.
  - Do not touch unrelated files or reformat code outside the scope of the current task.
  - Fit new code cleanly into existing patterns (e.g., FastAPI routers, services, React hooks, UI component structure).

## 10. No Fabricated Implementations
- **Rule:** Never claim that an API, integration, agent, tool, or feature works without verifying its implementation.
- **Practices:**
  - Test or compile modified code before claiming completion.
  - If an external dependency or service (e.g., Groq, MongoDB) is unavailable, state this clearly rather than mocking or claiming live verification.
  - Never fabricate test results, lint outputs, or execution statuses.

