# Contributing to HackonChain — OpenImpact

Thanks for your interest in contributing! This guide covers how to get involved during (and after) the hackathon.

## Getting started

1. Fork the repo and clone your fork locally.
2. Create a new branch from `main` for your work:

```bash
git checkout -b your-branch-name
```

3. Make your changes, commit, and push to your fork.
4. Open a pull request against `main` in this repo.

## Branch naming

Use a short descriptive prefix:

- `feat/` — new feature (e.g. `feat/donor-dashboard`)
- `fix/` — bug fix
- `docs/` — documentation only
- `refactor/` — code restructuring with no behavior change
- `ui/` — UI/styling changes

## Commit messages

Write clear, concise commit messages in the imperative mood:

- **Good:** `Add recipient proof upload form`
- **Bad:** `added stuff` or `updates`

## Project structure

```
docs/          — Product requirements, build prompts, and diagrams
README.md      — Project overview
LICENSE        — MIT license
```

As the codebase grows, expect `src/`, `public/`, and config files to appear here. Update this section when that happens.

## What to work on

Check open issues and the README's MVP scope for priorities. During the hackathon the main areas are:

- **Frontend (UI):** Building the screens listed in `docs/lovable-build-prompt.md`
- **Web3 / smart contracts:** Wiring real wallet + chain logic into the stubbed functions
- **AI trust layer:** Integrating the Gemini-based counterfeit/duplicate check
- **Docs & testing:** Improving requirements, adding tests, fixing typos

## Code style

- Keep code readable and well-structured.
- Avoid adding comments that just restate what the code does.
- Run any existing linters/formatters before committing.

## Pull request guidelines

- Keep PRs focused — one feature or fix per PR.
- Include a short description of what changed and why.
- Link to a related issue if one exists.
- Make sure your branch is up to date with `main` before requesting review.

## Reporting issues

Open a GitHub issue with:

- A clear title describing the problem or suggestion.
- Steps to reproduce (for bugs).
- Expected vs actual behavior.

## Code of conduct

Be respectful, constructive, and inclusive. We're building something to increase trust and transparency — let's hold ourselves to the same standard.
