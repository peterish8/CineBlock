---
name: google-r-style
description: Applies Google R style for formatting, naming, and conventions. Use when writing or reviewing R language, .R files, statistical scripts, or Google R style.
---

# Google R Style (Quick Reference)

Source: [https://google.github.io/styleguide/Rguide.html](https://google.github.io/styleguide/Rguide.html)

## When to load the detailed skill

Read [google-r-style-detailed](../google-r-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Google R style follows Tidyverse conventions where applicable.
- Use `<-` for assignment, not `=`.
- snake_case for function and variable names.
- Limit line length to 80 characters.
- Use explicit `library()` calls at top; organize scripts: libraries, data, functions, execution.
- Comment the 'why', not the 'what'.

## Quick checklist

- Match Google R naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/Rguide.html>
