---
name: google-angularjs-style
description: Applies Google AngularJS style for formatting, naming, and conventions. Use when writing or reviewing AngularJS, angular.js, ng- directives, $scope, or legacy Angular 1.x JavaScript.
---

# Google AngularJS Style (Quick Reference)

Source: [https://google.github.io/styleguide/angularjs-google-style.html](https://google.github.io/styleguide/angularjs-google-style.html)

## When to load the detailed skill

Read [google-angularjs-style-detailed](../google-angularjs-style-detailed/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

- Extends Google JavaScript style; use Closure `goog.provide`/`goog.require`.
- One consistent module definition; never mutate modules outside their definition file.
- Reference modules via `.name` property, not string literals.
- Controllers are classes; methods on `MyCtrl.prototype`. Prefer `controller as` syntax.
- Customer-facing code must be compiled with JSCompiler.
- Use a shared Angular externs file for type safety with Closure.

## Quick checklist

- Match Google AngularJS naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<https://google.github.io/styleguide/angularjs-google-style.html>
