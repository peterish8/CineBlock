---
name: google-shell-style-detailed
description: Comprehensive Google Shell style rules with section-level guidance. Use when google-shell-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Shell Style (Detailed)

Source: [https://google.github.io/styleguide/shellguide.html](https://google.github.io/styleguide/shellguide.html)

Pair with the quick reference: [google-shell-style](../google-shell-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-shell-style](../google-shell-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

#### When to use Shell

- If you're mostly calling other utilities and are doing relatively little
- If performance matters, use something other than shell.
- If you are writing a script that is more than 100 lines long, or that uses
- When assessing the complexity of your code (e.g. to decide whether to switch
#### File Extensions

- If the executable will have a build rule that renames the source file
- If the executable will be added directly to the user's PATH, then prefer
- If neither of the above apply, then either choice is acceptable.
#### Function Comments

- Description of the function.
- Globals: List of global variables used and modified.
- Arguments: Arguments taken.
- Outputs: Output to STDOUT or STDERR.
- Returns: Returned values other than the default exit status of the last
#### Case statement

- Indent alternatives by 2 spaces.
- A one-line alternative needs a space after the close parenthesis of the
- Long or multi-command alternatives should be split over multiple lines with
#### Variable expansion

- Stay consistent with what you find for existing code.
- Quote variables, see Quoting section below.
- Don't brace-delimit single character shell specials / positional parameters,
#### Quoting

- Always quote strings containing variables, command substitutions, spaces or
- Use arrays for safe quoting of lists of elements, especially command-line
- Optionally quote shell-internal, readonly
- Prefer quoting strings that are "words" (as opposed to command options or
- Be aware of the quoting rules for pattern matches in [[ … ]]. See the
- Use "$@" unless you have a specific reason to use $*, such as simply
#### Arrays Pros

- Using Arrays allows lists of things without confusing quoting semantics.
- Arrays make it possible to safely store sequences/lists of arbitrary
#### Arithmetic

- particularly with set -e enabled. For example,
