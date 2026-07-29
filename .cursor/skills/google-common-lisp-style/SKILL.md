---
name: google-common-lisp-style
description: Applies Google Common Lisp style for formatting, naming, and conventions. Use when writing or reviewing Common Lisp, .lisp files, defun, defmacro, or CLOS.
---

# Google Common Lisp Style (Quick Reference)

Source: [https://google.github.io/styleguide/lispguide.xml](https://google.github.io/styleguide/lispguide.xml)

## When to load the detailed skill

Read [google-common-lisp-style-detailed](../google-common-lisp-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Follow Google Common Lisp style for packages, naming, and formatting.
- Use packages to partition namespaces; `:use` only common packages like `:cl`.
- Naming: `*global*`, `+constant+`, `foo-bar-baz` for functions/variables.
- Keep lines ≤ 80 columns; indent with spaces reflecting nesting.
- Document public APIs with docstrings.

## Quick checklist

- Match Google Common Lisp naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/lispguide.xml>
