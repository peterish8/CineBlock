---
name: google-common-lisp-style-detailed
description: Comprehensive Google Common Lisp style rules with section-level guidance. Use when google-common-lisp-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Common Lisp Style (Detailed)

Source: [https://google.github.io/styleguide/lispguide.xml](https://google.github.io/styleguide/lispguide.xml)

Pair with the quick reference: [google-common-lisp-style](../google-common-lisp-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-common-lisp-style](../google-common-lisp-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

### Important Note: Note: Displaying Hidden Details in this Guide

- This style guide contains many details that are initially hidden from view. They are marked by the triangle icon, which you see here on your left. Click it now. You should see "Hooray" appear below.
### Meta-Guide: Must, Should, May, or Not

- Each guideline's level of importance is indicated by use of the following keywords and phrases, adapted from RFC 2119.
### Meta-Guide: Permission and Forgiveness

- There are cases where transgression of some of these rules is useful or even necessary. In some cases, you must seek permission or obtain forgiveness from the proper people.
### Meta-Guide: Conventions

- You MUST follow conventions. They are not optional.
### Meta-Guide: Old Code

- Fix old code as you go.
### Meta-Guide: Future Topics

- There are many topics for additional standardization not covered by current version of this document, but deferred to future versions.
### General Guidelines: Priorities

- When making decisions about how to write a given piece of code, aim for the following -ilities in this priority order: Usability by the customer Debuggability/Testability Readability/Comprehensibility Extensibility/Modifiability Efficiency (of the Lisp code at runtime)
### General Guidelines: Architecture

- To build code that is robust and maintainable, it matters a lot how the code is divided into components, how these components communicate, how changes propagate as they evolve, and more importantly how the programmers who develop these components communicate as these components evolve.
### General Guidelines: Using Libraries

- Often, the smallest hammer is to use an existing library. Or one that doesn't exist yet. In such cases, you are encouraged to use or develop such a library, but you must take appropriate precautions.
### General Guidelines: Open-Sourcing Code

- If you write a general-purpose library, or modify an existing open-source library, you are encouraged to publish the result separate from your main project and then have your project import it like any other open-source library.
### General Guidelines: Development Process

- Development process is outside the scope of this document. However, developers should remember at least these bits: get reviewed, write tests, eliminate warnings, run tests, avoid mass-changes.
### Formatting: Spelling and Abbreviations

- You must use correct spelling in your comments, and most importantly in your identifiers. When several correct spellings exist (including American vs English), and there isn't a consensus amongst developers as which to use, you should choose the shorter spelling. You must use only common and domain-specific abbreviations, and must be consistent with these abbreviations. You may abbreviate lexical variables of limited scope in order to avoid overly-long symbol names.
### Formatting: Line length

- You should format source code so that no line is longer than 100 characters.
### Formatting: Indentation

- Indent your code the way a properly configured GNU Emacs does. Maintain a consistent indentation style throughout a project. Indent carefully to make the code easier to understand.
### Formatting: File Header

- You should include a description at the top of each source file. You should include neither authorship nor copyright information in a source file.
### Formatting: Vertical white space

- Vertical white space: one blank line between top-level forms.
### Formatting: Horizontal white space

- Horizontal white space: none around parentheses. No tabs.
### Documentation: Document everything

- You should use document strings on all visible functions to explain how to use your code.
### Documentation: Comment semicolons

- You must use the appropriate number of semicolons to introduce comments.
### Documentation: Grammar and punctuation

- You should punctuate documentation correctly.
### Documentation: Attention Required

- You must follow the convention of using TODO comments for code requiring special attention. For code using unobvious forms, you must include a comment.
### Documentation: Domain-Specific Languages

- You should document DSLs and any terse program in a DSL.
### Naming: Symbol guidelines

- You should use lower case. You should follow the rules for Spelling and Abbreviations You should follow punctuation conventions.
### Naming: Denote intent, not content

- Name your variables according to their intent, not their content.
### Naming: Global variables and constants

- Name globals according to convention.
### Naming: Predicate names

- Names of predicate functions and variables end with a "P".
### Naming: Omit library prefixes

- You should not include a library or package name as a prefix within the name of symbols.
### Naming: Packages

- Use packages appropriately.
### Language usage guidelines: Mostly Functional Style

- You should avoid side-effects when they are not necessary.
### Language usage guidelines: Recursion

- You should favor iteration over recursion.
### Language usage guidelines: Special variables

- Use special variables sparingly.
### Language usage guidelines: Assignment

- Be consistent in assignment forms.
### Language usage guidelines: Assertions and Conditions

- You must make proper usage of assertions and conditions.
### Language usage guidelines: Type Checking

- If you know the type of something, you should make it explicit in order to enable compile-time and run-time sanity-checking.
### Language usage guidelines: CLOS

- Use CLOS appropriately.
