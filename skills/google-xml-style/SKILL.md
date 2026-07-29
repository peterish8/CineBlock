---
name: google-xml-style
description: Applies Google XML style for formatting, naming, and conventions. Use when writing or reviewing XML documents, schemas, instance formatting, or new XML formats.
---

# Google XML Style (Quick Reference)

Source: [https://google.github.io/styleguide/xmlstyle.html](https://google.github.io/styleguide/xmlstyle.html)

## When to load the detailed skill

Read [google-xml-style-detailed](../google-xml-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Prefer adapting existing formats over inventing new XML vocabularies.
- Use UTF-8 encoding. Pretty-print with consistent 2-space indent.
- Use elements for structured data; attributes only for metadata/IDs.
- Keep element names descriptive, lowercase, hyphen-separated.
- Namespace all elements when interoperability matters.

## Quick checklist

- Match Google XML naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/xmlstyle.html>
