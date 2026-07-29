---
name: google-go-style
description: Applies Google Go style for formatting, naming, and conventions. Use when writing or reviewing Go, Golang, .go files, goroutines, or Google Go style.
---

# Google Go Style (Quick Reference)

Source: [https://google.github.io/styleguide/go/guide](https://google.github.io/styleguide/go/guide)

## When to load the detailed skill

Read [google-go-style-detailed](../google-go-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Always run `gofmt`. Use MixedCaps/camelCase; no underscores in identifiers.
- Prioritize clarity, simplicity, concision, maintainability, consistency.
- Check errors explicitly: `if err := fn(); err != nil { ... }`.
- Short package names, lowercase, no underscores; avoid `util`, `common`, `helper`.
- Document exported symbols with complete sentences starting with the name.
- No line-length dogma; refactor instead of arbitrary wrapping.
- Prefer standard library; add dependencies only with clear benefit.

## Quick checklist

- Match Google Go naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/go/guide>
