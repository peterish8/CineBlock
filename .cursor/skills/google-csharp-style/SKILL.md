---
name: google-csharp-style
description: Applies Google C# style for formatting, naming, and conventions. Use when writing or reviewing C#, .cs files, .NET, or Google C# style.
---

# Google C# Style (Quick Reference)

Source: [https://google.github.io/styleguide/csharp-style.html](https://google.github.io/styleguide/csharp-style.html)

## When to load the detailed skill

Read [google-csharp-style-detailed](../google-csharp-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- PascalCase: classes, methods, enums, public members. camelCase: locals/parameters.
- Private fields: `_camelCase`. Interfaces: `IInterface`.
- 2-space indent, 100-column limit. Braces on same line; always use braces.
- One core class per file; filename matches main class (`MyClass.cs`).
- Modifier order: public protected internal private new abstract virtual override sealed static readonly extern unsafe volatile async.
- `using` directives alphabetical after `System` imports.

## Quick checklist

- Match Google C# naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/csharp-style.html>
