---
name: google-java-style
description: Applies Google Java style for formatting, naming, and conventions. Use when writing or reviewing Java, .java files, JVM code, or Google Java style.
---

# Google Java Style (Quick Reference)

Source: [https://google.github.io/styleguide/javaguide.html](https://google.github.io/styleguide/javaguide.html)

## When to load the detailed skill

Read [google-java-style-detailed](../google-java-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- UTF-8 source files; one top-level public class per file matching filename.
- 2-space indent, no tabs. Column limit 100.
- Braces required even for single-line blocks; K&R style (`} else {`).
- Naming: `ClassName`, `methodName`, `CONSTANT_VALUE`, `localVariable`.
- Javadoc on every public class and member; use `@param`, `@return`, `@throws`.
- One statement per line; one declaration per line.
- @Override required on all overrides; use `@Nullable`/`@Nonnull` annotations.
- Organize imports: no wildcards; static imports last, separated by blank line.

## Quick checklist

- Match Google Java naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/javaguide.html>
