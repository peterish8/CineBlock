---
name: google-r-style-detailed
description: Comprehensive Google R style rules with section-level guidance. Use when google-r-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google R Style (Detailed)

Source: [https://google.github.io/styleguide/Rguide.html](https://google.github.io/styleguide/Rguide.html)

Pair with the quick reference: [google-r-style](../google-r-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-r-style](../google-r-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

## Good

- Infix functions (%name%) always need to be imported.
- Certain rlang pronouns, notably .data, need to be imported.
- Functions from default R packages, including datasets, utils,
