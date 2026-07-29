---
name: google-objective-c-style
description: Applies Google Objective-C style for formatting, naming, and conventions. Use when writing or reviewing Objective-C, ObjC, .m/.h files, Cocoa, or Apple platform code.
---

# Google Objective-C Style (Quick Reference)

Source: [https://google.github.io/styleguide/objcguide.html](https://google.github.io/styleguide/objcguide.html)

## When to load the detailed skill

Read [google-objective-c-style-detailed](../google-objective-c-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Optimize for the reader; be consistent with Apple SDK conventions.
- 2-space indent. 80-column limit. Braces on same line.
- Naming: `UpperCamelCase` classes; `lowerCamelCase` methods/variables.
- Document all public interfaces with `/** */` comments adjacent to declarations.
- Use `#import`, not `#include`. Order: own header, system, project.
- Prefer properties (`@property`) over raw ivars; specify atomicity and memory.
- Use `instancetype` for factory methods; `nullable`/`nonnull` annotations.

## Quick checklist

- Match Google Objective-C naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/objcguide.html>
