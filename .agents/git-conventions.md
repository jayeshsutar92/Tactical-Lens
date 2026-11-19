# Git and Commit Conventions for PressLens

All commits and version control operations in the PressLens repository must follow these standards.

---

## 1. Repository-Local Git Author Identity

Every commit in this repository must use the following author identity:

- **Git username:** `Jay`
- **Git email:** `jayeshsutar312@gmail.com`

This identity is configured locally in the repository via:
```bash
git config --local user.name "Jay"
git config --local user.email "jayeshsutar312@gmail.com"
```

> **Safety Rule:** Never modify repository authentication credentials, SSH keys, remote URLs, or account access settings.

---

## 2. Conventional Commits Standard

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<optional scope>): <concise, descriptive subject>

[optional body explaining 'why' and context]

[optional footer(s), e.g., references to issues]
```

### Commit Types

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feat:` | A new feature or capability | `feat(tactics): add pressing intensity heatmap endpoint` |
| `fix:` | A bug fix | `fix(frontend): resolve pitch canvas re-render glitch` |
| `chore:` | Maintenance, configuration, dependency updates | `chore: update ESLint configuration for React 19` |
| `docs:` | Documentation changes only | `docs: add API documentation for tactical analysis` |
| `refactor:` | Code change that neither fixes a bug nor adds a feature | `refactor(backend): extract pitch zone calculation utility` |
| `test:` | Adding missing tests or correcting existing tests | `test(agent): add test scenarios for 4-3-3 high press evaluation` |
| `perf:` | A code change that improves performance | `perf(frontend): memoize tactical board SVG elements` |
| `ci:` | Changes to CI/CD configuration and scripts | `ci: add GitHub Actions workflow for lint and tests` |
| `build:` | Changes that affect the build system or external dependencies | `build: update vite and typescript build configs` |

---

## 3. Commit Guidelines

- **Concise & Descriptive:** Write clear subjects in the imperative mood (e.g., `feat(api): add health check route`, not `added health check`).
- **Atomic Commits:** Keep commits focused on a single logical change. Avoid bundling unrelated fixes, formatting changes, and features together.
- **Never Commit Without User Intent:** Never perform automatic git commits or push changes merely as part of setup or background tasks unless the user explicitly requests a commit.
- **Clean Diffs:** Avoid committing generated artifacts, temporary files, `.venv`, `node_modules`, or environment files (`.env`).

