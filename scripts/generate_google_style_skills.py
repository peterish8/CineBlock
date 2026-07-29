#!/usr/bin/env python3
"""Generate short and detailed Cursor skills from Google style guides."""

from __future__ import annotations

import html
import re
import textwrap
from pathlib import Path

STYLEGUIDE_ROOT = Path("/tmp/google-styleguide")
OUTPUT_ROOT = Path("/workspace/.cursor/skills")

LANGUAGES = [
    {
        "id": "angularjs",
        "name": "AngularJS",
        "triggers": "AngularJS, angular.js, ng- directives, $scope, or legacy Angular 1.x JavaScript",
        "url": "https://google.github.io/styleguide/angularjs-google-style.html",
        "sources": ["angularjs-google-style.html"],
    },
    {
        "id": "common-lisp",
        "name": "Common Lisp",
        "triggers": "Common Lisp, .lisp files, defun, defmacro, or CLOS",
        "url": "https://google.github.io/styleguide/lispguide.xml",
        "sources": ["lispguide.xml"],
    },
    {
        "id": "cpp",
        "name": "C++",
        "triggers": "C++, .cc/.h files, headers, RAII, or Google C++ style",
        "url": "https://google.github.io/styleguide/cppguide.html",
        "sources": ["cppguide.html"],
    },
    {
        "id": "csharp",
        "name": "C#",
        "triggers": "C#, .cs files, .NET, or Google C# style",
        "url": "https://google.github.io/styleguide/csharp-style.html",
        "sources": ["csharp-style.md"],
    },
    {
        "id": "go",
        "name": "Go",
        "triggers": "Go, Golang, .go files, goroutines, or Google Go style",
        "url": "https://google.github.io/styleguide/go/guide",
        "sources": ["go/guide.md", "go/decisions.md", "go/best-practices.md"],
    },
    {
        "id": "html-css",
        "name": "HTML/CSS",
        "triggers": "HTML, CSS, markup, stylesheets, or web front-end structure",
        "url": "https://google.github.io/styleguide/htmlcssguide.html",
        "sources": ["htmlcssguide.html"],
    },
    {
        "id": "javascript",
        "name": "JavaScript",
        "triggers": "JavaScript, JS, .js files, ES modules, or Google JS style",
        "url": "https://google.github.io/styleguide/jsguide.html",
        "sources": ["jsguide.html"],
    },
    {
        "id": "java",
        "name": "Java",
        "triggers": "Java, .java files, JVM code, or Google Java style",
        "url": "https://google.github.io/styleguide/javaguide.html",
        "sources": ["javaguide.html"],
    },
    {
        "id": "json",
        "name": "JSON",
        "triggers": "JSON, .json files, API payloads, or JSON configuration",
        "url": "https://google.github.io/styleguide/jsoncstyleguide.html",
        "sources": ["jsoncstyleguide.xml"],
    },
    {
        "id": "markdown",
        "name": "Markdown",
        "triggers": "Markdown, .md files, README docs, or technical writing",
        "url": "https://google.github.io/styleguide/docguide/style.html",
        "sources": ["docguide/style.md"],
    },
    {
        "id": "objective-c",
        "name": "Objective-C",
        "triggers": "Objective-C, ObjC, .m/.h files, Cocoa, or Apple platform code",
        "url": "https://google.github.io/styleguide/objcguide.html",
        "sources": ["objcguide.md"],
    },
    {
        "id": "python",
        "name": "Python",
        "triggers": "Python, .py files, pylint, type hints, or Google Python style",
        "url": "https://google.github.io/styleguide/pyguide.html",
        "sources": ["pyguide.md"],
    },
    {
        "id": "r",
        "name": "R",
        "triggers": "R language, .R files, statistical scripts, or Google R style",
        "url": "https://google.github.io/styleguide/Rguide.html",
        "sources": ["Rguide.md"],
    },
    {
        "id": "shell",
        "name": "Shell",
        "triggers": "shell scripts, Bash, .sh files, or Google shell style",
        "url": "https://google.github.io/styleguide/shellguide.html",
        "sources": ["shellguide.md"],
    },
    {
        "id": "typescript",
        "name": "TypeScript",
        "triggers": "TypeScript, TS, .ts/.tsx files, or Google TypeScript style",
        "url": "https://google.github.io/styleguide/tsguide.html",
        "sources": ["tsguide.html"],
    },
    {
        "id": "vimscript",
        "name": "Vim script",
        "triggers": "Vim script, .vim files, Vim plugins, or vimscript",
        "url": "https://google.github.io/styleguide/vimscriptguide.xml",
        "sources": ["vimscriptguide.xml"],
    },
    {
        "id": "xml",
        "name": "XML",
        "triggers": "XML documents, schemas, instance formatting, or new XML formats",
        "url": "https://google.github.io/styleguide/xmlstyle.html",
        "sources": ["xmlstyle.html"],
    },
]

# Curated essentials merged with extracted content (highest-signal rules first).
CURATED: dict[str, dict[str, list]] = {
    "python": {
        "short": [
            "Run pylint with Google's pylintrc; suppress warnings only with `# pylint: disable=...` and a reason.",
            "Imports: use `import x` or `from pkg import module` (not individual classes). Use full package paths; avoid relative imports except within packages.",
            "No mutable module-level globals. Use exceptions (not assert) for runtime checks.",
            "Line length: 80 chars max. Indent with 4 spaces, no tabs.",
            'Use triple-quoted docstrings on public modules, classes, and functions; follow Google docstring sections (Args, Returns, Raises).',
            "Naming: `module_name`, `ClassName`, `function_name`, `GLOBAL_CONSTANT`, `_private`.",
            "Type annotations on public APIs; use `X | None` not `Optional[X]` for new code.",
            "Prefer f-strings or `.format()`; avoid `%` on new code. Use `with` for files/sockets.",
            "Use Black/Pyink for formatting when the team allows it.",
        ],
        "sections": [
            {
                "title": "Language rules",
                "rules": [
                    "Run pylint on all code.",
                    "Imports must be on separate lines; order: future, stdlib, third-party, local.",
                    "Avoid nested functions unless closing over locals; avoid mutable default args.",
                    "Use properties for trivial accessors; use `@property` decorator.",
                    "Threading: document locks; prefer `queue` over manual condition variables.",
                ],
            },
            {
                "title": "Formatting",
                "rules": [
                    "No semicolons. No trailing whitespace.",
                    "Two blank lines between top-level defs; one blank line between methods.",
                    "Trailing commas in multi-line literals when helpful for diffs.",
                ],
            },
        ],
    },
    "javascript": {
        "short": [
            "Use `const`/`let`, never `var`. Semicolons required.",
            "2-space indent, 80-column soft limit; wrap at 80 when readability improves.",
            "camelCase for variables/functions; PascalCase for classes; `SCREAMING_SNAKE` for constants.",
            "Use single quotes for strings unless escaping is worse.",
            "JSDoc on all exported/public APIs with `@param`, `@return`, `@throws`.",
            "Use ES modules (`import`/`export`); one class or primary symbol per file when practical.",
            "Prefer `===`/`!==`; use `/** @type */` when Closure types are needed.",
            "No `with`. Avoid `eval` and `new Function`.",
        ],
    },
    "typescript": {
        "short": [
            "Follow the Google JavaScript style guide; TypeScript adds typing rules on top.",
            "Use explicit types on exported/public APIs; avoid `any` unless justified.",
            "Prefer `interface` for object shapes; use `type` for unions/intersections.",
            "Use `readonly` and `as const` where values are immutable.",
            "Naming mirrors JS: camelCase members, PascalCase types/classes.",
            "Use ES modules; enable strict compiler options in tsconfig.",
        ],
    },
    "java": {
        "short": [
            "UTF-8 source files; one top-level public class per file matching filename.",
            "2-space indent, no tabs. Column limit 100.",
            "Braces required even for single-line blocks; K&R style (`} else {`).",
            "Naming: `ClassName`, `methodName`, `CONSTANT_VALUE`, `localVariable`.",
            "Javadoc on every public class and member; use `@param`, `@return`, `@throws`.",
            "One statement per line; one declaration per line.",
            "@Override required on all overrides; use `@Nullable`/`@Nonnull` annotations.",
            "Organize imports: no wildcards; static imports last, separated by blank line.",
        ],
    },
    "go": {
        "short": [
            "Always run `gofmt`. Use MixedCaps/camelCase; no underscores in identifiers.",
            "Prioritize clarity, simplicity, concision, maintainability, consistency.",
            "Check errors explicitly: `if err := fn(); err != nil { ... }`.",
            "Short package names, lowercase, no underscores; avoid `util`, `common`, `helper`.",
            "Document exported symbols with complete sentences starting with the name.",
            "No line-length dogma; refactor instead of arbitrary wrapping.",
            "Prefer standard library; add dependencies only with clear benefit.",
        ],
    },
    "cpp": {
        "short": [
            "2-space indent, 80-column limit. Use `#pragma once` or include guards.",
            "Naming: `MyClass`, `my_variable`, `kConstant`, `my_function()`.",
            "Headers self-contained; include what you use; prefer forward declarations.",
            "Use RAII; prefer smart pointers (`std::unique_ptr`, `std::shared_ptr`).",
            "No exceptions in new code unless project allows; prefer status returns.",
            "Use `nullptr`, `auto` where it aids readability, range-for, and `override`/`final`.",
            "Namespaces: unnamed for `.cc` locals; named namespaces in headers.",
        ],
    },
    "csharp": {
        "short": [
            "PascalCase: classes, methods, enums, public members. camelCase: locals/parameters.",
            "Private fields: `_camelCase`. Interfaces: `IInterface`.",
            "2-space indent, 100-column limit. Braces on same line; always use braces.",
            "One core class per file; filename matches main class (`MyClass.cs`).",
            "Modifier order: public protected internal private new abstract virtual override sealed static readonly extern unsafe volatile async.",
            "`using` directives alphabetical after `System` imports.",
        ],
    },
    "shell": {
        "short": [
            "Bash only for executables: `#!/bin/bash` with `set` options for robustness.",
            "Use shell only for small utilities/wrappers; rewrite >100 lines in a structured language.",
            "Indent 2 spaces. Line length max 80.",
            "Quote variables: `\"$var\"`. Use `[[ ... ]]` for tests, not `[ ... ]` or `test`.",
            "Check return values; use `$(cmd)` not backticks. Avoid `eval`.",
            "Lowercase function names with underscores; `readonly` for constants.",
            "Run ShellCheck. Use `local` in functions.",
        ],
    },
    "json": {
        "short": [
            "Valid JSON per json.org; no comments in production JSON.",
            "Double quotes for all property names and string values.",
            "Property names: camelCase ASCII identifiers (like JavaScript).",
            "Flatten data by default; nest only when structure is semantically meaningful.",
            "Use strings for decimals, large integers, and enums—not raw JSON numbers when precision matters.",
            "Use ISO 8601 for dates/times. Boolean values are `true`/`false` lowercase.",
            "Distinguish JSON objects (fixed schema) from JSON maps (arbitrary keys).",
        ],
    },
    "markdown": {
        "short": [
            "Prefer readable plain Markdown over HTML.",
            "One H1 per document; use ATX headings (`#`).",
            "80-character line limit for prose; fenced code blocks with language tags.",
            "Use reference links for long URLs; define references after first use.",
            "Capitalize product names correctly; sentence case for headings unless title case is established.",
            "Delete stale docs frequently; small accurate docs beat sprawling outdated ones.",
        ],
    },
    "html-css": {
        "short": [
            "Use HTML for structure, CSS for presentation; avoid presentation-only HTML.",
            "Double quotes for attribute values. Lowercase tag and attribute names.",
            "Omit optional tags where HTML5 allows; use semantic elements.",
            "Use valid HTML5; specify `<!DOCTYPE html>`.",
            "CSS: prefer classes over IDs for styling; avoid `!important`.",
            "Use shorthand properties where clear; one declaration per line in multi-rule blocks.",
        ],
    },
    "angularjs": {
        "short": [
            "Extends Google JavaScript style; use Closure `goog.provide`/`goog.require`.",
            "One consistent module definition; never mutate modules outside their definition file.",
            "Reference modules via `.name` property, not string literals.",
            "Controllers are classes; methods on `MyCtrl.prototype`. Prefer `controller as` syntax.",
            "Customer-facing code must be compiled with JSCompiler.",
            "Use a shared Angular externs file for type safety with Closure.",
        ],
    },
    "objective-c": {
        "short": [
            "Optimize for the reader; be consistent with Apple SDK conventions.",
            "2-space indent. 80-column limit. Braces on same line.",
            "Naming: `UpperCamelCase` classes; `lowerCamelCase` methods/variables.",
            "Document all public interfaces with `/** */` comments adjacent to declarations.",
            "Use `#import`, not `#include`. Order: own header, system, project.",
            "Prefer properties (`@property`) over raw ivars; specify atomicity and memory.",
            "Use `instancetype` for factory methods; `nullable`/`nonnull` annotations.",
        ],
    },
    "r": {
        "short": [
            "Google R style follows Tidyverse conventions where applicable.",
            "Use `<-` for assignment, not `=`.",
            "snake_case for function and variable names.",
            "Limit line length to 80 characters.",
            "Use explicit `library()` calls at top; organize scripts: libraries, data, functions, execution.",
            "Comment the 'why', not the 'what'.",
        ],
    },
    "common-lisp": {
        "short": [
            "Follow Google Common Lisp style for packages, naming, and formatting.",
            "Use packages to partition namespaces; `:use` only common packages like `:cl`.",
            "Naming: `*global*`, `+constant+`, `foo-bar-baz` for functions/variables.",
            "Keep lines ≤ 80 columns; indent with spaces reflecting nesting.",
            "Document public APIs with docstrings.",
        ],
    },
    "vimscript": {
        "short": [
            "Prefer single-quoted strings (double quotes are semantically different).",
            "Use `=~#` or `=~?` for string comparisons, not bare `=~`.",
            "Prefix regexes with `\\m\\C` for portable behavior.",
            "Use `normal!` not `normal`; avoid `:substitute` in scripts.",
            "Match error codes in exceptions, not error text.",
            "See vimscriptfull.xml for extended rationale.",
        ],
    },
    "xml": {
        "short": [
            "Prefer adapting existing formats over inventing new XML vocabularies.",
            "Use UTF-8 encoding. Pretty-print with consistent 2-space indent.",
            "Use elements for structured data; attributes only for metadata/IDs.",
            "Keep element names descriptive, lowercase, hyphen-separated.",
            "Namespace all elements when interoperability matters.",
        ],
    },
}

SHORT_RULE_LIMIT = 18
DETAILED_SECTION_LIMIT = 35
DETAILED_RULES_PER_SECTION = 10


def read_sources(sources: list[str]) -> str:
    parts: list[str] = []
    for rel in sources:
        path = STYLEGUIDE_ROOT / rel
        if path.exists():
            parts.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n\n".join(parts)


def strip_tags(raw: str) -> str:
    text = re.sub(r"<script[^>]*>.*?</script>", "", raw, flags=re.I | re.S)
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.I | re.S)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</(p|div|li|h[1-6]|tr|td|th|summary)>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text)


def clean_line(line: str) -> str:
    line = line.strip()
    line = re.sub(r"\s+", " ", line)
    line = re.sub(r"^[-*•]\s+", "", line)
    line = re.sub(r"^\d+\.\s+", "", line)
    return line


def is_valid_rule(rule: str) -> bool:
    if len(rule) < 20 or len(rule) > 500:
        return False
    lower = rule.lower()
    if re.match(r"^\d+(\s+\w+){0,3}\s+rules?$", lower):
        return False
    if re.match(r"^\d+(\.\d+)*\s+", rule):
        return False
    if rule.lower() in {"pros", "cons", "definition", "decision", "note"}:
        return False
    if rule.endswith(":") and len(rule) < 40:
        return False
    if "table of contents" in lower:
        return False
    if rule.count(" ") < 2:
        return False
    return True


def extract_xml_stylepoints(raw: str) -> list[dict]:
    sections: list[dict] = []
    current_category = "General"
    for match in re.finditer(
        r'<CATEGORY title="([^"]+)">|<STYLEPOINT title="([^"]+)">\s*<SUMMARY>\s*(.*?)\s*</SUMMARY>',
        raw,
        flags=re.S,
    ):
        cat, title, summary = match.groups()
        if cat:
            current_category = cat
            continue
        if title and summary:
            summary_text = clean_line(strip_tags(summary))
            if is_valid_rule(summary_text):
                sections.append(
                    {
                        "title": f"{current_category}: {title}",
                        "level": 2,
                        "rules": [summary_text],
                    }
                )
    return sections


def extract_html_sections(raw: str) -> list[dict]:
    sections: list[dict] = []
    pattern = re.compile(
        r"<h([2-4])[^>]*>(.*?)</h\1>(.*?)(?=<h[2-4][^>]*>|$)",
        flags=re.I | re.S,
    )
    for match in pattern.finditer(raw):
        level = int(match.group(1))
        title = clean_line(strip_tags(match.group(2)))
        body = match.group(3)
        if is_noise_heading(title):
            continue
        rules: list[str] = []
        for li in re.findall(r"<li[^>]*>(.*?)</li>", body, flags=re.I | re.S):
            text = clean_line(strip_tags(li))
            if is_valid_rule(text):
                rules.append(text)
        for p in re.findall(r"<p[^>]*>(.*?)</p>", body, flags=re.I | re.S):
            text = clean_line(strip_tags(p))
            if text.lower().startswith(("why?", "note", "tip:", "example")):
                continue
            if is_valid_rule(text):
                rules.append(text)
        if rules:
            sections.append({"title": title, "level": level, "rules": rules[:DETAILED_RULES_PER_SECTION]})
    return sections


def normalize_markdown(raw: str) -> str:
    text = re.sub(r"<!--.*?-->", "", raw, flags=re.S)
    text = re.sub(r"\{%\s*raw\s*%\}|\{%\s*endraw\s*%\}", "", text)
    text = re.sub(r"<a[^>]*id=\"([^\"]+)\"[^>]*></a>", "", text)
    return text


def extract_markdown_sections(raw: str) -> list[dict]:
    text = normalize_markdown(raw)
    sections: list[dict] = []
    current: dict | None = None

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        heading = None
        level = 0
        if stripped.startswith("#"):
            hashes = len(stripped) - len(stripped.lstrip("#"))
            if 1 <= hashes <= 4:
                heading = stripped[hashes:].strip()
                level = hashes
        elif re.match(r"^\d+(?:\.\d+)*\s+\S", stripped):
            heading = re.sub(r"^\d+(?:\.\d+)*\s+", "", stripped)
            level = min(stripped.count(".") + 1, 4)

        if heading:
            if is_noise_heading(heading):
                current = None
                continue
            current = {"title": heading, "level": level, "rules": []}
            sections.append(current)
            continue

        if current is None:
            continue
        if stripped.startswith("|"):
            continue

        bullet = None
        if stripped.startswith(("- ", "* ")):
            bullet = stripped[2:].strip()
        elif re.match(r"^\d+\.\s+", stripped):
            bullet = re.sub(r"^\d+\.\s+", "", stripped)
        elif stripped.lower().startswith("decision"):
            bullet = stripped

        if bullet:
            bullet = clean_line(bullet)
            bullet = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", bullet)
            bullet = re.sub(r"`([^`]+)`", r"\1", bullet)
            if is_valid_rule(bullet) and bullet not in current["rules"]:
                current["rules"].append(bullet)

    return [s for s in sections if s["rules"]]


def is_noise_heading(title: str) -> bool:
    lower = title.lower().strip()
    return lower in {
        "table of contents",
        "contents",
        "background",
        "about",
        "example",
        "principles",
        "authors",
        "note",
        "overview",
        "introduction",
        "parting words",
    } or len(title) < 3


def parse_guide(raw: str) -> list[dict]:
    if "<STYLEPOINT" in raw or "<GUIDE" in raw:
        sections = extract_xml_stylepoints(raw)
        if sections:
            return sections
    if "<h2" in raw.lower() or "<h3" in raw.lower():
        sections = extract_html_sections(raw)
        if sections:
            return sections
    return extract_markdown_sections(raw)


def merge_curated(lang_id: str, sections: list[dict]) -> tuple[list[str], list[dict]]:
    curated = CURATED.get(lang_id, {})
    short_rules = list(curated.get("short", []))
    detailed = list(curated.get("sections", []))

    if not short_rules:
        seen: set[str] = set()
        for section in sections:
            for rule in section["rules"]:
                key = rule.lower()
                if key in seen or not is_valid_rule(rule):
                    continue
                seen.add(key)
                short_rules.append(rule)
                if len(short_rules) >= SHORT_RULE_LIMIT:
                    break
            if len(short_rules) >= SHORT_RULE_LIMIT:
                break

    detailed_titles = {s["title"].lower() for s in detailed}
    for section in sections:
        if section["title"].lower() not in detailed_titles:
            detailed.append(section)
            detailed_titles.add(section["title"].lower())

    if not short_rules:
        short_rules = [
            "Follow the official Google style guide for formatting and naming.",
            "Prefer clarity and consistency with surrounding code.",
            "Match established patterns in the file or package before introducing new conventions.",
        ]

    return short_rules[:SHORT_RULE_LIMIT], detailed[:DETAILED_SECTION_LIMIT]


def format_bullets(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def short_skill(lang: dict, short_rules: list[str]) -> str:
    short_id = f"google-{lang['id']}-style"
    detailed_id = f"google-{lang['id']}-style-detailed"
    desc = (
        f"Applies Google {lang['name']} style for formatting, naming, and conventions. "
        f"Use when writing or reviewing {lang['triggers']}."
    )
    return f"""---
name: {short_id}
description: {desc}
---

# Google {lang['name']} Style (Quick Reference)

Source: [{lang['url']}]({lang['url']})

## When to load the detailed skill

Read [{detailed_id}](../{detailed_id}/SKILL.md) when you need:

- Section-by-section rules, examples, or edge cases
- PR review with non-trivial style questions
- Resolving conflicts between local habits and Google style

The detailed skill is linked here so agents can load it automatically alongside this quick reference.

## Core rules

{format_bullets(short_rules)}

## Quick checklist

- Match Google {lang['name']} naming and formatting conventions
- Keep code readable; prefer consistency within the file and package
- Run language-appropriate linters/formatters when available
- Document non-obvious behavior with brief, accurate comments
- Defer to the official guide when this skill is silent

## Official guide

<{lang['url']}>
"""


def detailed_skill(lang: dict, sections: list[dict]) -> str:
    short_id = f"google-{lang['id']}-style"
    detailed_id = f"google-{lang['id']}-style-detailed"
    desc = (
        f"Comprehensive Google {lang['name']} style rules with section-level guidance. "
        f"Use when {short_id} is insufficient, for thorough reviews, or when the user names this skill."
    )

    blocks: list[str] = []
    for section in sections:
        rules = section["rules"][:DETAILED_RULES_PER_SECTION]
        if not rules:
            continue
        level = min(section.get("level", 2) + 1, 4)
        blocks.append(f"{'#' * level} {section['title']}\n\n{format_bullets(rules)}")

    if not blocks:
        blocks.append(f"See the official guide: {lang['url']}")

    return f"""---
name: {detailed_id}
description: {desc}
disable-model-invocation: true
---

# Google {lang['name']} Style (Detailed)

Source: [{lang['url']}]({lang['url']})

Pair with the quick reference: [{short_id}](../{short_id}/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [{short_id}](../{short_id}/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

{chr(10).join(blocks)}
"""


def reference_file(lang: dict) -> str:
    sources = "\n".join(f"- `{src}`" for src in lang["sources"])
    extra = ""
    if lang["id"] == "go":
        extra = """
## Go style document set

- [Guide](https://google.github.io/styleguide/go/guide)
- [Decisions](https://google.github.io/styleguide/go/decisions)
- [Best practices](https://google.github.io/styleguide/go/best-practices)
"""
    if lang["id"] == "vimscript":
        extra = """
## Extended guide

- [vimscriptfull.xml](https://google.github.io/styleguide/vimscriptfull.xml)
"""
    return f"""# Google {lang['name']} Style — Reference

Official guide: {lang['url']}

## Source files in google/styleguide

{sources}
{extra}
## License

Google style guides are licensed under [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/).
"""


def write_skill(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> None:
    if not STYLEGUIDE_ROOT.exists():
        raise SystemExit(f"Missing styleguide clone at {STYLEGUIDE_ROOT}")

    for lang in LANGUAGES:
        raw = read_sources(lang["sources"])
        sections = parse_guide(raw)
        short_rules, detailed_sections = merge_curated(lang["id"], sections)

        short_dir = OUTPUT_ROOT / f"google-{lang['id']}-style"
        detailed_dir = OUTPUT_ROOT / f"google-{lang['id']}-style-detailed"

        write_skill(short_dir / "SKILL.md", short_skill(lang, short_rules))
        write_skill(detailed_dir / "SKILL.md", detailed_skill(lang, detailed_sections))
        write_skill(detailed_dir / "reference.md", reference_file(lang))

        print(f"{lang['id']}: {len(short_rules)} short rules, {len(detailed_sections)} sections")

    print(f"\nGenerated {len(LANGUAGES) * 2} skills under {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
