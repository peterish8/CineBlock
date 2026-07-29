---
name: google-python-style-detailed
description: Comprehensive Google Python style rules with section-level guidance. Use when google-python-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Python Style (Detailed)

Source: [https://google.github.io/styleguide/pyguide.html](https://google.github.io/styleguide/pyguide.html)

Pair with the quick reference: [google-python-style](../google-python-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-python-style](../google-python-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

### Language rules

- Run pylint on all code.
- Imports must be on separate lines; order: future, stdlib, third-party, local.
- Avoid nested functions unless closing over locals; avoid mutable default args.
- Use properties for trivial accessors; use `@property` decorator.
- Threading: document locks; prefer `queue` over manual condition variables.
### Formatting

- No semicolons. No trailing whitespace.
- Two blank lines between top-level defs; one blank line between methods.
- Trailing commas in multi-line literals when helpful for diffs.
#### 2.2.4 Decision

- Use import x for importing packages and modules.
- Use from x import y where x is the package prefix and y is the module
- Use from x import y as z in any of the following circumstances:
- Two modules named y are to be imported.
- y conflicts with a top-level name defined in the current module.
- y conflicts with a common parameter name that is part of the public
- y is an inconveniently long name.
- y is too generic in the context of your code (e.g., `from
- Use import y as z only when z is a standard abbreviation (e.g., `import
- Symbols from the following modules are used to support static analysis and
#### 2.4.4 Decision

- Make use of built-in exception classes when it makes sense. For example,
- Do not use assert statements in place of conditionals or validating
## The type checking of the return statement relies on the assert.

- Libraries or packages may define their own exceptions. When doing so they
- Never use catch-all except: statements, or catch Exception or
- re-raising the exception, or
- creating an isolation point in the program where exceptions are not
- Minimize the amount of code in a try/except block. The larger the body
- Use the finally clause to execute code whether or not an exception is
#### 2.5.3 Cons

- Breaks encapsulation: Such design can make it hard to achieve valid
- Has the potential to change module behavior during the import, because
#### 2.13.2 Pros

- Allows for an attribute access and assignment API rather than
- Can be used to make an attribute read-only.
- Allows calculations to be lazy.
- Provides a way to maintain the public interface of a class when the
#### 2.13.3 Cons

- Can hide side-effects much like operator overloading.
- Can be confusing for subclasses.
#### 2.14.4 Decision

- Always use if foo is None: (or is not None) to check for a None value.
- Never compare a boolean variable to False using ==. Use if not x:
- For sequences (strings, lists, tuples), use the fact that empty sequences
- When handling integers, implicit false may involve more risk than benefit
- Note that '0' (i.e., 0 as string) evaluates to true.
- Note that Numpy arrays may raise an exception in an implicit boolean
#### 3.2 Line length

- Long import statements.
- URLs, pathnames, or long flags in comments.
- Long string module-level constants not containing whitespace that would be
- Pylint disable comments. (e.g.: # pylint: disable=invalid-name)
#### 3.8.3 Functions and Methods

- being part of the public API
#### 3.10.2 Error Messages

- The message needs to precisely match the actual error condition.
- Interpolated pieces need to always be clearly identifiable as such.
- They should allow simple automated processing (e.g. grepping).
#### 3.11 Files, Sockets, and similar Stateful Resources

- They may consume limited system resources, such as file descriptors. Code
- Holding files open may prevent other actions such as moving or deleting
- Files and sockets that are shared throughout a program may inadvertently be
- There are no guarantees as to when the runtime will actually invoke the
- Unexpected references to the file, e.g. in globals or exception tracebacks,
#### 3.13 Imports formatting

- Python future import statements. For example:
- Python standard library imports. For example:
- **Deprecated:** application-specific imports that are part of the same
#### 3.16.1 Names to Avoid

- single character names, except for specifically allowed cases:
- counters or iterators (e.g. i, j, k, v, et al.)
- e as an exception identifier in try/except statements.
- f as a file handle in with statements
- private type variables with no constraints (e.g.
- names that match established notation in a reference paper or algorithm
- dashes (-) in any package/module name
- __double_leading_and_trailing_underscore__ names (reserved by Python)
- names that needlessly include the type of the variable (for example:
#### 3.16.2 Naming Conventions

- "Internal" means internal to a module, or protected or private within a
- Prepending a single underscore (_) has some support for protecting module
- Prepending a double underscore (__ aka "dunder") to an instance variable
- Place related classes and top-level functions together in a
- Use CapWords for class names, but lower\_with\_under.py for module names.
- New *unit test* files follow PEP 8 compliant lower\_with\_under method
#### 3.16.5 Mathematical Notation

- Cite the source of all naming conventions, preferably with a hyperlink to
- Prefer PEP8-compliant descriptive_names for public APIs, which are much
- Use a narrowly-scoped pylint: disable=invalid-name directive to silence
#### 3.19.1 General Rules

- Familiarize yourself with
- Annotating self or cls is generally not necessary.
- Similarly, don't feel compelled to annotate the return value of __init__
- If any other variable or a returned type should not be expressed, use Any.
- You are not required to annotate all the functions in a module.
- At least annotate your public APIs.
- Use judgment to get to a good balance between safety and clarity on the
- Annotate code that is prone to type-related errors (previous bugs or
- Annotate code that is hard to understand.
- Annotate code as it becomes stable from a types perspective. In many
#### 3.19.10 Type variables

- not externally visible
#### 3.19.13 Conditional Imports

- Conditionally imported types need to be referenced as strings, to be forward
- Only entities that are used solely for typing should be defined here; this
- The block should be right after all the normal imports.
- There should be no empty lines in the typing imports list.
- Sort this list as if it were a regular imports list.
