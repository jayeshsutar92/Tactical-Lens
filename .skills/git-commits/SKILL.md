---
name: git-commits
description: Standard operating procedure for verifying Git author identity and crafting Conventional Commits in PressLens.
---

# Git Commits & Author Identity Skill

This skill enforces proper Git author metadata and Conventional Commits compliance for all Git operations in PressLens.

---

## 1. Author Identity Verification

Ensure repository-local configuration matches the required identity before creating commits:

```bash
git config --local user.name "Jay"
git config --local user.email "jayeshsutar312@gmail.com"
```

Verify the local identity:
```bash
git config --local user.name
# Output must be: Jay

git config --local user.email
# Output must be: jayeshsutar312@gmail.com
```

> **Warning:** Never alter global Git configuration, credentials, or remote URLs.

---

## 2. Conventional Commit Message Construction

All commits must follow this structure:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Allowed Types
- `feat`: New feature or user capability
- `fix`: Bug fix
- `chore`: Build tools, config, dependencies, standards setup
- `docs`: Documentation updates
- `refactor`: Code restructuring without functional changes
- `test`: Test suite additions or corrections
- `perf`: Performance improvements
- `ci`: CI/CD pipeline changes
- `build`: Build system or package dependencies

### Example Commit Invocations
```bash
# Feature commit
git commit -m "feat(tactics): add pressing intensity radar visualization"

# Bugfix commit
git commit -m "fix(api): correct coordinate bounding box validation"

# Maintenance commit
git commit -m "chore(agents): establish permanent engineering standards and skills"
```

---

## 3. Pre-Commit Checklist

Before committing:
1. Run `git status` and `git diff --staged` to verify that only intended files are staged.
2. Confirm no `.env`, credentials, or temporary files are staged.
3. Verify that all verification checks (ESLint, TypeScript, Python compilation) have passed.
4. Never auto-commit unless the user explicitly requested a Git commit in their prompt.

