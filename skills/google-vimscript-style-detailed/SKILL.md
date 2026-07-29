---
name: google-vimscript-style-detailed
description: Comprehensive Google Vim script style rules with section-level guidance. Use when google-vimscript-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Vim script Style (Detailed)

Source: [https://google.github.io/styleguide/vimscriptguide.xml](https://google.github.io/styleguide/vimscriptguide.xml)

Pair with the quick reference: [google-vimscript-style](../google-vimscript-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-vimscript-style](../google-vimscript-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

### Portability: Strings

- Prefer single quoted strings
### Portability: Matching Strings

- Use the =~# or =~? operator families over the =~ family.
### Portability: Regular Expressions

- Prefix all regexes with \m\C.
### Portability: Dangerous commands

- Avoid commands with unintended side effects.
### Portability: Fragile commands

- Avoid commands that rely on user settings.
### Portability: Catching Exceptions

- Match error codes, not error text.
### General Guidelines: Messaging

- Message the user infrequently.
### General Guidelines: Type checking

- Use strict and explicit checks where possible.
### General Guidelines: Other Languages

- Use vimscript instead.
### General Guidelines: Plugin layout

- Organize functionality into modular plugins
### General Guidelines: Functions

- In the autoload/ directory, defined with [!] and [abort].
### General Guidelines: Commands

- In the plugin/commands.vim or under the ftplugin/ directory, defined without [!].
### General Guidelines: Autocommands

- Place them in plugin/autocmds.vim, within augroups.
### General Guidelines: Mappings

- Place them in plugin/mappings.vim, using maktaba#plugin#MapPrefix to get a prefix.
### General Guidelines: Settings

- Change settings locally
### Style: Naming

- In general, use plugin-names-like-this, FunctionNamesLikeThis, CommandNamesLikeThis, augroup_names_like_this, variable_names_like_this. Always prefix variables with their scope.
