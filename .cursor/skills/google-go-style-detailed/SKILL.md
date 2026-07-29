---
name: google-go-style-detailed
description: Comprehensive Google Go style rules with section-level guidance. Use when google-go-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Go Style (Detailed)

Source: [https://google.github.io/styleguide/go/guide](https://google.github.io/styleguide/go/guide)

Pair with the quick reference: [google-go-style](../google-go-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-go-style](../google-go-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

### Style principles

- **[Clarity]**: The code's purpose and rationale is clear to the reader.
- **[Simplicity]**: The code accomplishes its goal in the simplest way
- **[Concision]**: The code has a high signal-to-noise ratio.
- **[Maintainability]**: The code is written such that it can be easily
- **[Consistency]**: The code is consistent with the broader Google codebase.
#### Clarity

- What is the code actually doing?
- Why is the code doing what it does?
#### What is the code actually doing?

- Use more descriptive variable names
- Add additional commentary
- Break up the code with whitespace and comments
- Refactor the code into separate functions/methods to make it more modular
#### Why is the code doing what it does?

- A nuance in the language, e.g., a closure will be capturing a loop variable,
- A nuance of the business logic, e.g., an access control check that needs to
- Maintainer comments in
- strings.Cut is only four lines of code,
#### Simplicity

- Is easy to read from top to bottom
- Does not assume that you already know what it is doing
- Does not assume that you can memorize all of the preceding code
- Does not have unnecessary levels of abstraction
- Does not have names that call attention to something mundane
- Makes the propagation of values and decisions clear to the reader
- Has comments that explain why, not what, the code is doing to avoid future
- Has documentation that stands on its own
- Has useful errors and useful test failures
- May often be mutually exclusive with "clever" code
#### Least mechanism

- Aim to use a core language construct (for example a channel, slice, map,
- If there isn't one, look for a tool within the standard library (like an
- Finally, consider whether there is a core library in the Google codebase
#### Maintainability

- Is easy for a future programmer to modify correctly
- Has APIs that are structured so that they can grow gracefully
- Is clear about the assumptions that it makes and chooses abstractions that
- Avoids unnecessary coupling and doesn't include features that are not used
- Has a comprehensive test suite to ensure promised behaviors are maintained
#### Line length

- Before an indentation change (e.g.,
- To make a long string (e.g., a URL) fit into multiple shorter lines
#### Naming

- Not feel repetitive when they are used
- Take the context into consideration
- Not repeat concepts that are already clear
#### Local consistency

- Use of %s or %v for formatted printing of errors
- Usage of buffered channels in lieu of mutexes
- Line length restrictions for code
- Use of assertion-based testing libraries
#### Underscores

- Package names that are only imported by generated code may contain
- Test, Benchmark and Example function names within *_test.go files may
- Low-level libraries that interoperate with the operating system or cgo may
#### Package names

- Using the _test suffix for unit tests that only exercise the exported API
- Using underscores and the _test suffix for packages that specify
- Using the _test suffix for
- Guidance on so-called "utility packages"
- Go Tip #97: What's in a Name
- Go Tip #108: The Power of a Good Package Name
#### Receiver names

- Short (usually one or two letters in length)
- Abbreviations for the type itself
- Applied consistently to every receiver for that type
- Not an underscore; omit the name if it is unused
#### Initialisms

- In names with multiple initialisms (e.g. XMLAPI because it contains XML
- In names with an initialism containing a lowercase letter (e.g. DDoS,
#### Variable names

- A small scope is one in which one or two small operations are performed, say
- A medium scope is a few small or one large operation, say 8-15 lines.
- A large scope is one or a few large operations, say 15-25 lines.
- A very large scope is anything that spans more than a page (say, more than
### lines).

- Single-word names like count or options are a good starting point.
- Additional words can be added to disambiguate similar names, for example
- Do not simply drop letters to save typing. For example Sandbox is
- Omit [types and type-like words] from most variable names.
- For a number, userCount is a better name than numUsers or
- For a slice, users is a better name than userSlice.
- It is acceptable to include a type-like qualifier if there are two
- Omit words that are clear from the [surrounding context]. For example, in
#### Single-letter variable names

- For a [method receiver variable], a one-letter or two-letter name is
- Using familiar variable names for common types is often helpful:
- r for an io.Reader or *http.Request
- w for an io.Writer or http.ResponseWriter
- Single-letter identifiers are acceptable as integer loop variables,
- Abbreviations can be acceptable loop identifiers when the scope is short,
#### Package comments

- Example command-line invocations and API usage can be useful documentation.
- If there is no obvious primary file or if the package comment is
- Multiline comments can be used instead of multiple single-line comments.
- Comments intended for maintainers and that apply to the whole file are
#### Import grouping

- Standard library packages
- Other (project and vendored) packages
- Protocol Buffer imports (e.g., fpb "path/to/foo_go_proto")
- Import for side-effects
#### Import "blank" (`import _`)

- image/jpeg in image processing code
- You may use a blank import to bypass the check for disallowed imports in the
- You may use a blank import of the embed package
#### Handle errors

- Handle and address the error immediately.
- Return the error to the caller.
- In exceptional situations, call [log.Fatal] or (if absolutely necessary)
#### Field names

- Include field names for types from other packages.
- For package-local types, field names are optional.
#### Cuddled braces

- The indentation matches
- The inner values are also literals or proto builders (i.e. not a variable or
#### Indentation confusion

- Conditionals and loops
#### Goroutine lifetimes

- The code probably has undefined behavior in production, and the program may
- The code is difficult to test meaningfully due to the code's indeterminate
- The code may leak resources as described above.
- [Never start a goroutine without knowing how it will stop][cheney-stop]
- Rethinking Classical Concurrency Patterns: [slides][rethinking-slides],
- [When Go programs end]
- [Documentation Conventions: Contexts]
#### Interfaces

- Do not wrap RPC clients in new manual interfaces just for the sake of
- Do not define back doors or export [test double] implementations of an
#### Generics

- [Write code, don't design types]. From a GopherCon talk by Robert Griesemer
- If you have several types that share a useful unifying interface, consider
- Otherwise, instead of relying on the any type and excessive
- [Using Generics in Go], talk by Ian Lance Taylor
- [Generics tutorial] on Go's webpage
#### Receiver type

- If the receiver is a slice and the method doesn't reslice or reallocate the
- If the method needs to mutate the receiver, the receiver must be a pointer.
- If the receiver is a struct containing fields that
- If the receiver is a "large" struct or array, a pointer receiver may be more
- For methods that will call or run concurrently with other functions that
- If the receiver is a struct or array, any of whose elements is a pointer to
- If the receiver is a [built-in type], such as an integer or a string, that
- If the receiver is a map, function, or channel, use a value rather than a
- If the receiver is a "small" array or struct that is naturally a value type
- When in doubt, use a pointer receiver.
#### Synchronous functions

- "Rethinking Classical Concurrency Patterns", talk by Bryan Mills:
#### Flags

- [Tip of the Week #45: Avoid Flags, Especially in Library Code][totw-45]
- Go Tip #10: Configuration Structs and Flags
- Go Tip #80: Dependency Injection Principles
#### Logging

- Best practices on logging errors and
- When and how to use the log package to
#### Contexts

- In an HTTP handler, where the context comes from
- In streaming RPC methods, where the context comes from the stream.
- In test functions (e.g. TestXXX, BenchmarkXXX, FuzzXXX), where the
- In other entrypoint functions (see below for examples of such functions),
- In binary targets: main
- In general purpose code and libraries: init
- [Contexts and structs]
### Useful test failures

- What caused the failure
- What inputs resulted in an error
#### Assertion libraries

- Equality comparison and diffs
- For more on the distinction between test helpers and assertion helpers, see
- [Go FAQ] section on [testing frameworks] and their opinionated absence
#### Equality comparison and diffs

- [pretty] produces aesthetically pleasing difference reports. However, it
