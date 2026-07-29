---
name: google-shell-style
description: Applies Google Shell style for formatting, naming, and conventions. Use when writing or reviewing shell scripts, Bash, .sh files, or Google shell style.
---

# Google Shell Style (Quick Reference)

Source: [https://google.github.io/styleguide/shellguide.html](https://google.github.io/styleguide/shellguide.html)

## When to load the detailed skill

Read [google-shell-style-detailed](../google-shell-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Bash only for executables: `#!/bin/bash` with `set` options for robustness.
- Use shell only for small utilities/wrappers; rewrite >100 lines in a structured language.
- Indent 2 spaces. Line length max 80.
- Quote variables: `"$var"`. Use `[[ ... ]]` for tests, not `[ ... ]` or `test`.
- Check return values; use `$(cmd)` not backticks. Avoid `eval`.
- Lowercase function names with underscores; `readonly` for constants.
- Run ShellCheck. Use `local` in functions.

## Quick checklist

- Match Google Shell naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/shellguide.html>
