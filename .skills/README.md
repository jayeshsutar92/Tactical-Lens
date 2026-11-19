# PressLens Reusable Agent Skills (`.skills/`)

This directory contains specialized, reusable skills and procedural runbooks that AI agents and developers follow when performing development, maintenance, and verification tasks on the PressLens project.

## Available Skills

| Skill | Path | Description | When to Use |
| :--- | :--- | :--- | :--- |
| **Code Quality & Linting** | [`code-quality/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/code-quality/SKILL.md) | Enforces zero ESLint errors, strict TypeScript type checking, and Python code quality. | Whenever modifying frontend or backend source files. |
| **Tactical AI Engineering** | [`tactical-analysis-ai/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/tactical-analysis-ai/SKILL.md) | Standardized workflow for LLM integrations, prompt engineering, structured I/O, and football tactical grounding. | When developing AI-driven tactical analysis features, agents, or tools. |
| **Verification Runner** | [`verification-runner/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/verification-runner/SKILL.md) | Multi-step verification runbook (ESLint, TypeScript, Python syntax/tests) and reporting format. | Mandatory before declaring any coding task complete. |
| **Git Commits & Author Identity** | [`git-commits/SKILL.md`](file:///d:/Personal%20Project/PressLens/.skills/git-commits/SKILL.md) | Standard procedure for validating git author identity (`Jay <jayeshsutar312@gmail.com>`) and crafting Conventional Commits. | When creating commits, reviewing staged changes, or formatting PRs. |

## Standards Integration

These skills directly execute the principles defined in [`.agents/`](file:///d:/Personal%20Project/PressLens/.agents):
- [Mandatory Engineering Standards](file:///d:/Personal%20Project/PressLens/.agents/engineering-standards.md)
- [FDE and AI Agent Engineering Standards](file:///d:/Personal%20Project/PressLens/.agents/ai-agent-standards.md)
- [Git and Commit Conventions](file:///d:/Personal%20Project/PressLens/.agents/git-conventions.md)
- [Execution and Verification Workflow](file:///d:/Personal%20Project/PressLens/.agents/execution-workflow.md)

