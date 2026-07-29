---
name: google-typescript-style
description: Applies Google TypeScript style for formatting, naming, and conventions. Use when writing or reviewing TypeScript, TS, .ts/.tsx files, or Google TypeScript style.
---

# Google TypeScript Style (Quick Reference)

Source: [https://google.github.io/styleguide/tsguide.html](https://google.github.io/styleguide/tsguide.html)

## When to load the detailed skill

Read [google-typescript-style-detailed](../google-typescript-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Follow the Google JavaScript style guide; TypeScript adds typing rules on top.
- Use explicit types on exported/public APIs; avoid `any` unless justified.
- Prefer `interface` for object shapes; use `type` for unions/intersections.
- Use `readonly` and `as const` where values are immutable.
- Naming mirrors JS: camelCase members, PascalCase types/classes.
- Use ES modules; enable strict compiler options in tsconfig.

## Quick checklist

- Match Google TypeScript naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/tsguide.html>
