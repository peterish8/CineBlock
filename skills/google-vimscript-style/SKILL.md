---
name: google-vimscript-style
description: Applies Google Vim script style for formatting, naming, and conventions. Use when writing or reviewing Vim script, .vim files, Vim plugins, or vimscript.
---

# Google Vim script Style (Quick Reference)

Source: [https://google.github.io/styleguide/vimscriptguide.xml](https://google.github.io/styleguide/vimscriptguide.xml)

## When to load the detailed skill

Read [google-vimscript-style-detailed](../google-vimscript-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Prefer single-quoted strings (double quotes are semantically different).
- Use `=~#` or `=~?` for string comparisons, not bare `=~`.
- Prefix regexes with `\m\C` for portable behavior.
- Use `normal!` not `normal`; avoid `:substitute` in scripts.
- Match error codes in exceptions, not error text.
- See vimscriptfull.xml for extended rationale.

## Quick checklist

- Match Google Vim script naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/vimscriptguide.xml>
