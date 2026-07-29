---
name: google-cpp-style
description: Applies Google C++ style for formatting, naming, and conventions. Use when writing or reviewing C++, .cc/.h files, headers, RAII, or Google C++ style.
---

# Google C++ Style (Quick Reference)

Source: [https://google.github.io/styleguide/cppguide.html](https://google.github.io/styleguide/cppguide.html)

## When to load the detailed skill

Read [google-cpp-style-detailed](../google-cpp-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- 2-space indent, 80-column limit. Use `#pragma once` or include guards.
- Naming: `MyClass`, `my_variable`, `kConstant`, `my_function()`.
- Headers self-contained; include what you use; prefer forward declarations.
- Use RAII; prefer smart pointers (`std::unique_ptr`, `std::shared_ptr`).
- No exceptions in new code unless project allows; prefer status returns.
- Use `nullptr`, `auto` where it aids readability, range-for, and `override`/`final`.
- Namespaces: unnamed for `.cc` locals; named namespaces in headers.

## Quick checklist

- Match Google C++ naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/cppguide.html>
