---
name: google-csharp-style-detailed
description: Comprehensive Google C# style rules with section-level guidance. Use when google-csharp-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google C# Style (Detailed)

Source: [https://google.github.io/styleguide/csharp-style.html](https://google.github.io/styleguide/csharp-style.html)

Pair with the quick reference: [google-csharp-style](../google-csharp-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-csharp-style](../google-csharp-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

#### Code

- Names of classes, methods, enumerations, public fields, public properties,
- Names of local variables, parameters: camelCase.
- Names of private, protected, internal and protected internal fields and
- Naming convention is unaffected by modifiers such as const, static,
- For casing, a "word" is anything written without internal spaces, including
- Names of interfaces start with I, e.g. IInterface.
#### Files

- Filenames and directory names are PascalCase, e.g. MyFile.cs.
- Where possible the file name should be the same as the name of the main
- In general, prefer one core class per file.
#### Organization

- Modifiers occur in the following order: `public protected internal private
- Namespace using declarations go at the top, before any namespaces. using
- Group class members in the following order:
- Nested classes, enums, delegates and events.
- Static, const and readonly fields.
- Fields and properties.
- Constructors and finalizers.
- Within each group, elements should be in the following order:
- Where possible, group interface implementations together.
#### Whitespace rules

- A maximum of one statement per line.
- A maximum of one assignment per statement.
- Indentation of 2 spaces, no tabs.
- No line break before opening brace.
- No line break between closing brace and else.
- Braces used even when optional.
- Space after if/for/while etc., and after commas.
- No space after an opening parenthesis or before a closing parenthesis.
- No space between a unary operator and its operand. One space between the
- Line wrapping developed from Google C++ style guidelines, with minor
#### Constants

- Variables and fields that can be made const should always be made const.
- If const isn’t possible, readonly can be a suitable alternative.
- Prefer named constants to magic numbers.
#### IEnumerable vs IList vs IReadOnlyList

- For inputs use the most restrictive collection type possible, for example
- For outputs, if passing ownership of the returned container to the owner,
#### Generators vs containers

- Use your best judgement, bearing in mind:
- Generator code is often less readable than filling in a container.
- Generator code can be more performant if the results are going to be
- Generator code that is directly turned into a container via ToList()
- Generator code that is called multiple times will be considerably slower
#### Property styles

- For single line read-only properties, prefer expression body properties
- For everything else, use the older { get; set; } syntax.
#### Expression body syntax

- Judiciously use expression body syntax in lambdas and properties.
- Don’t use on method definitions. This will be reviewed when C# 7 is live,
- As with methods and other scoped blocks of code, align the closing with the
#### Structs and classes:

- Structs are very different from classes:
- Structs are always passed and returned by value.
- Assigning a value to a member of a returned struct doesn’t modify the
- Almost always use a class.
- Consider struct when the type can be treated like other value types - for
- Note that this guidance may vary from team to team where, for example,
#### Lambdas vs named methods

- If a lambda is non-trivial (e.g. more than a couple of statements, excluding
#### Field initializers

- Field initializers are generally encouraged.
#### Extension methods

- Only use an extension method when the source of the original class is not
- Only use an extension method if the functionality being added is a ‘core’
- Note - if we have the source to the class being extended, and the
- Only put extension methods into core libraries that are available
- Be aware that using extension methods always obfuscates the code, so err on
#### ref and out

- Use out for returns that are not also inputs.
- Place out parameters after all other parameters in the method definition.
- ref should be used rarely, when mutating an input is necessary.
- Do not use ref as an optimisation for passing structs.
- Do not use ref to pass a modifiable container into a method. ref is only
#### LINQ

- In general, prefer single line LINQ calls and imperative code, rather than
- Prefer member extension methods over SQL-style LINQ keywords - e.g. prefer
- Avoid Container.ForEach(...) for anything longer than a single statement.
#### Array vs List

- In general, prefer List<> over arrays for public variables, properties,
- Prefer List<> when the size of the container can change.
- Prefer arrays when the size of the container is fixed and known at
- Prefer array for multidimensional arrays.
- array and List<> both represent linear, contiguous containers.
- Similar to C++ arrays vs std::vector, arrays are of fixed capacity,
- In some cases arrays are more performant, but in general List<> is
#### Folders and file locations

- Be consistent with the project.
- Prefer a flat structure where possible.
#### Use of tuple as a return type

- In general, prefer a named class type over Tuple<>, particularly when
#### String interpolation vs `String.Format()` vs `String.Concat` vs `operator+`

- In general, use whatever is easiest to read, particularly for logging and
- Be aware that chained operator+ concatenations will be slower and cause
- If performance is a concern, StringBuilder will be faster for multiple
#### `using`

- Generally, don’t alias long typenames with using. Often this is a sign
- e.g. using RecordList = List<Tuple<int, float>> should probably be a
- Be aware that using statements are only file scoped and so of limited use.
#### Object Initializer syntax

- Object Initializer Syntax is fine for ‘plain old data’ types.
- Avoid using this syntax for classes or structs with constructors.
- If splitting across multiple lines, indent one block level.
#### Namespace naming

- In general, namespaces should be no more than 2 levels deep.
- Don't force file/folder layout to match namespaces.
- For shared library/module code, use namespaces. For leaf 'application' code,
- New top-level namespace names must be globally unique and recognizable.
#### Default values/null returns for structs

- Prefer returning a ‘success’ boolean value and a struct out value.
- Where performance isn't a concern and the resulting code significantly more
- Nullable structs are convenient, but reinforce the general ‘null is
#### Removing from containers while iterating

- If all that is required is to remove items that satisfy some condition,
- If other work needs to be done in the iteration, RemoveAll may not be
#### Calling delegates

- When calling a delegate, use Invoke() and use the null conditional
#### The `var` keyword

- Use of var is encouraged if it aids readability by avoiding type names
- When the type is obvious - e.g. var apple = new Apple();, or `var
- For transient variables that are only passed directly to other methods -
- When working with basic types - e.g. var success = true;
- When working with compiler-resolved built-in numeric types - e.g. `var
- When users would clearly benefit from knowing the type - e.g. `var
#### Attributes

- Attributes should appear on the line above the field, property, or method
- Multiple attributes should be separated by newlines. This allows for easier
#### Argument Naming

- If the argument is a literal constant, and the same constant is used in
- Consider changing the function signature to replace a bool argument with
- Replace large or complex nested expressions with named variables.
- For functions that have several configuration options, consider defining a
