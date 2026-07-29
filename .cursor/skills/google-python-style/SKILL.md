---
name: google-python-style
description: Applies Google Python style for formatting, naming, and conventions. Use when writing or reviewing Python, .py files, pylint, type hints, or Google Python style.
---

# Google Python Style (Quick Reference)

Source: [https://google.github.io/styleguide/pyguide.html](https://google.github.io/styleguide/pyguide.html)

## When to load the detailed skill

Read [google-python-style-detailed](../google-python-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Run pylint with Google's pylintrc; suppress warnings only with `# pylint: disable=...` and a reason.
- Imports: use `import x` or `from pkg import module` (not individual classes). Use full package paths; avoid relative imports except within packages.
- No mutable module-level globals. Use exceptions (not assert) for runtime checks.
- Line length: 80 chars max. Indent with 4 spaces, no tabs.
- Use triple-quoted docstrings on public modules, classes, and functions; follow Google docstring sections (Args, Returns, Raises).
- Naming: `module_name`, `ClassName`, `function_name`, `GLOBAL_CONSTANT`, `_private`.
- Type annotations on public APIs; use `X | None` not `Optional[X]` for new code.
- Prefer f-strings or `.format()`; avoid `%` on new code. Use `with` for files/sockets.
- Use Black/Pyink for formatting when the team allows it.

## Quick checklist

- Match Google Python naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/pyguide.html>
