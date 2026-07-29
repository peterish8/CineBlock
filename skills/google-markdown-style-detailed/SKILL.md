---
name: google-markdown-style-detailed
description: Comprehensive Google Markdown style rules with section-level guidance. Use when google-markdown-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Markdown Style (Detailed)

Source: [https://google.github.io/styleguide/docguide/style.html](https://google.github.io/styleguide/docguide/style.html)

Pair with the quick reference: [google-markdown-style](../google-markdown-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-markdown-style](../google-markdown-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

## Markdown style guide

- *Source text is readable and portable.*
- *The Markdown corpus is maintainable over time and across teams.*
- *The syntax is simple and easy to remember.*
- Minimum viable documentation
- Better is better than best
- Character line limit
- Use unique, complete names for headings
- Add spacing to headings
- Use a single H1 heading
- Capitalization of titles and headers
### Minimum viable documentation

- Identify what you really need: release docs, API docs, testing guidelines.
- Delete cruft frequently and in small batches.
### Better is better than best

- When reasonable, LGTM immediately and trust that comments will be fixed
- Prefer to suggest an alternative rather than leaving a vague comment.
- For substantial changes, start your own follow-up CL instead. Especially try
- On rare occasions, hold up submission if the CL actually makes the docs
- Avoid wasting cycles with trivial argument. Capitulate early and move on.
- Cite the Better/Best Rule as often as needed.
### See also

- # Document title: The first heading should be a level-one heading, ideally
- author: *Optional*. If you'd like to claim ownership of the document or
- Short introduction. 1–3 sentences providing a high-level overview of the
- ## Topic: The rest of your headings should start from level 2.
- ## See also: Put miscellaneous links at the bottom for the user who wants
### Character line limit

- **Tooling integration**: All our tooling is designed around code, so the
- **Quality**. The more engineers use their well-worn coding habits when
#### Nested list spacing

- Use 2 spaces after the item number, so the text itself is indented 4 spaces.
- Use 2 spaces again for the next item.
- Use 3 spaces after a bullet, so the text itself is indented 4 spaces.
- Use 2 spaces with numbered lists, as before.
- Looks nice, doesn't it?
- Back to the bulleted list, indented 3 spaces.
- Irregular nesting... DO NOT DO THIS.
- Two spaces for the list item
#### Use fenced code blocks instead of indented code blocks

- You cannot specify the language. Some Markdown features are tied to language
- The beginning and end of the code block are ambiguous.
- Indented code blocks are harder to search for in Code Search.
### Images

- Use images when it's easier to *show* a reader something than to *describe
- Make sure to provide appropriate text to describe your image. Readers who
### Tables

- **Poor distribution**: Several columns don't differ across rows, and some
- **Unbalanced dimensions**: There are a small number of rows relative to
- **Rambling prose** in some cells. Tables should tell a succinct story at a
#### Banana

- Relatively uniform data distribution across two dimensions.
- Many parallel items with distinct attributes.
