---
name: google-html-css-style
description: Applies Google HTML/CSS style for formatting, naming, and conventions. Use when writing or reviewing HTML, CSS, markup, stylesheets, or web front-end structure.
---

# Google HTML/CSS Style (Quick Reference)

Source: [https://google.github.io/styleguide/htmlcssguide.html](https://google.github.io/styleguide/htmlcssguide.html)

## When to load the detailed skill

Read [google-html-css-style-detailed](../google-html-css-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Use HTML for structure, CSS for presentation; avoid presentation-only HTML.
- Double quotes for attribute values. Lowercase tag and attribute names.
- Omit optional tags where HTML5 allows; use semantic elements.
- Use valid HTML5; specify `<!DOCTYPE html>`.
- CSS: prefer classes over IDs for styling; avoid `!important`.
- Use shorthand properties where clear; one declaration per line in multi-rule blocks.

## Quick checklist

- Match Google HTML/CSS naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/htmlcssguide.html>
