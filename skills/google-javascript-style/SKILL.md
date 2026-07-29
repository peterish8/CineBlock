---
name: google-javascript-style
description: Applies Google JavaScript style for formatting, naming, and conventions. Use when writing or reviewing JavaScript, JS, .js files, ES modules, or Google JS style.
---

# Google JavaScript Style (Quick Reference)

Source: [https://google.github.io/styleguide/jsguide.html](https://google.github.io/styleguide/jsguide.html)

## When to load the detailed skill

Read [google-javascript-style-detailed](../google-javascript-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Use `const`/`let`, never `var`. Semicolons required.
- 2-space indent, 80-column soft limit; wrap at 80 when readability improves.
- camelCase for variables/functions; PascalCase for classes; `SCREAMING_SNAKE` for constants.
- Use single quotes for strings unless escaping is worse.
- JSDoc on all exported/public APIs with `@param`, `@return`, `@throws`.
- Use ES modules (`import`/`export`); one class or primary symbol per file when practical.
- Prefer `===`/`!==`; use `/** @type */` when Closure types are needed.
- No `with`. Avoid `eval` and `new Function`.

## Quick checklist

- Match Google JavaScript naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/jsguide.html>
