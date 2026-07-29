---
name: google-json-style
description: Applies Google JSON style for formatting, naming, and conventions. Use when writing or reviewing JSON, .json files, API payloads, or JSON configuration.
---

# Google JSON Style (Quick Reference)

Source: [https://google.github.io/styleguide/jsoncstyleguide.html](https://google.github.io/styleguide/jsoncstyleguide.html)

## When to load the detailed skill

Read [google-json-style-detailed](../google-json-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Valid JSON per json.org; no comments in production JSON.
- Double quotes for all property names and string values.
- Property names: camelCase ASCII identifiers (like JavaScript).
- Flatten data by default; nest only when structure is semantically meaningful.
- Use strings for decimals, large integers, and enums—not raw JSON numbers when precision matters.
- Use ISO 8601 for dates/times. Boolean values are `true`/`false` lowercase.
- Distinguish JSON objects (fixed schema) from JSON maps (arbitrary keys).

## Quick checklist

- Match Google JSON naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/jsoncstyleguide.html>
