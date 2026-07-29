---
name: google-javascript-style-detailed
description: Comprehensive Google JavaScript style rules with section-level guidance. Use when google-javascript-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google JavaScript Style (Detailed)

Source: [https://google.github.io/styleguide/jsguide.html](https://google.github.io/styleguide/jsguide.html)

Pair with the quick reference: [google-javascript-style](../google-javascript-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-javascript-style](../google-javascript-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

### 1 Introduction

- This document serves as the complete definition of Google’s coding standards for source code in the JavaScript programming language. A JavaScript source file is described as being in Google Style if and only if it adheres to the rules herein.
- Like other programming style guides, the issues covered span not only aesthetic issues of formatting, but other types of conventions or coding standards as well. However, this document focuses primarily on the hard-and-fast rules that we follow universally, and avoids giving advice that isn't clearly enforceable (whether by human or tool).
#### 1.1 Terminology notes

- The term comment always refers to implementation comments. We do not use the phrase documentation comments, instead using the common term “JSDoc” for both human-readable text and machine-readable annotations within /** … */.
- This Style Guide uses RFC 2119 terminology when using the phrases must, must not, should, should not, and may. The terms prefer and avoid correspond to should and should not, respectively. Imperative and declarative statements are prescriptive and correspond to must.
- In this document, unless otherwise clarified:
- The term comment always refers to implementation comments. We do not use the phrase documentation comments, instead using the common term “JSDoc” for both human-readable text and machine-readable annotations within /** … */.
- This Style Guide uses RFC 2119 terminology when using the phrases must, must not, should, should not, and may. The terms prefer and avoid correspond to should and should not, respectively. Imperative and declarative statements are prescriptive and correspond to must.
- Other terminology notes will appear occasionally throughout the document.
#### 2.1 File name

- File names must be all lowercase and may include underscores (_) or dashes (-), but no additional punctuation. Follow the convention that your project uses. Filenames’ extension must be .js.
#### 2.2 File encoding: UTF-8

- Source files are encoded in UTF-8.
#### 2.3.1 Whitespace characters

- All other whitespace characters in string literals are escaped, and
- Tab characters are not used for indentation.
- Aside from the line terminator sequence, the ASCII horizontal space character (0x20) is the only whitespace character that appears anywhere in a source file. This implies that
- All other whitespace characters in string literals are escaped, and
- Tab characters are not used for indentation.
#### 2.3.2 Special escape sequences

- For any character that has a special escape sequence (\', \", \\, \b, \f, \n, \r, \t, \v), that sequence is used rather than the corresponding numeric escape (e.g \x0a, \u000a, or \u{a}). Legacy octal escapes are never used.
#### 2.3.3 Non-ASCII characters

- For the remaining non-ASCII characters, either the actual Unicode character (e.g. ∞) or the equivalent hex or Unicode escape (e.g. \u221e) is used, depending only on which makes the code easier to read and understand.
### 3 Source file structure

- License or copyright information, if present
- @fileoverview JSDoc, if present
- goog.module statement, if a goog.module file
- ES import statements, if an ES module
- goog.require and goog.requireType statements
- The file’s implementation
- All new source files should either be a goog.module file (a file containing a goog.module call) or an ECMAScript (ES) module (uses import and export statements).
- Files consist of the following, in order:
- Exactly one blank line separates each section that is present, except the file's implementation, which may be preceded by 1 or 2 blank lines.
#### 3.1 License or copyright information, if present

- If license or copyright information belongs in a file, it belongs here.
#### 3.2 @fileoverview JSDoc, if present

- See ?? for formatting rules.
#### 3.3 goog.module statement

- All goog.module files must declare exactly one goog.module name on a single line: lines containing a goog.module declaration must not be wrapped, and are therefore an exception to the 80-column limit.
- The entire argument to goog.module is what defines a namespace. It is the package name (an identifier that reflects the fragment of the directory structure where the code lives) plus, optionally, the main class/enum/interface that it defines concatenated to the end in lowerCamelCase.
#### 3.3.1 Hierarchy

- Module namespaces may never be named as a direct child of another module's namespace.
- goog.module('foo.bar'); // 'foo.bar.qux' would be fine, though goog.module('foo.bar.baz'); The directory hierarchy reflects the namespace hierarchy, so that deeper-nested children are subdirectories of higher-level parent directories. Note that this implies that owners of “parent” namespace groups are necessarily aware of all child namespaces, since they exist in the same directory.
#### 3.3.2 goog.module.declareLegacyNamespace

- The single goog.module statement may optionally be followed by a call to goog.module.declareLegacyNamespace();. Avoid goog.module.declareLegacyNamespace() when possible.
#### 3.3.3 goog.module Exports

- Classes, enums, functions, constants, and other symbols are exported using the exports object. Exported symbols may be defined directly on the exports object, or else declared locally and exported separately. Symbols are only exported if they are meant to be used outside the module. Non-exported module-local symbols are not declared @private. There is no prescribed ordering for exported and module-local symbols.
- /** @const */ exports = {exportedFunction}; Do not use default exports as they don't translate easily to ES module semantics.
- exports = FancyClass;
#### 3.4 ES modules

- ES modules are files that use the import and export keywords.
#### 3.4.1 Imports

- Import statements must not be line wrapped and are therefore an exception to the 80-column limit.
- ES module files must use the import statement to import other ES module files. Do not goog.require another ES module.
- import './sideeffects.js'; import * as goog from '../closure/goog/goog.js'; import * as parent from '../parent.js'; import {name} from './sibling.js';
- The .js file extension is not optional in import paths and must always be included.
- import '../directory/file'; import '../directory/file.js'; 3.4.1.2 Importing the same file multiple times Do not import the same file multiple times. This can make it hard to determine the aggregate imports of a file.
- // Imports have the same path, but since it doesn't align it can be hard to see. import {short} from './long/path/to/a/file.js'; import {aLongNameThatBreaksAlignment} from './long/path/to/a/file.js';
- Module import names (import * as name) are lowerCamelCase names that are derived from the imported file name.
- Default import names are derived from the imported file name and follow the rules in ??.
- import MyClass from '../my-class.js'; import myFunction from '../my_function.js'; import SOME_CONSTANT from '../someconstant.js'; Note: In general this should not happen as default exports are banned by this style guide, see ??. Default imports are only used to import modules that do not conform to this style guide.
- In general symbols imported via the named import (import {name}) should keep the same name. Avoid aliasing imports (import {SomeThing as SomeOtherThing}). Prefer fixing name collisions by using a module import (import *) or renaming the exports themselves.
#### 3.4.2 Exports

- Symbols are only exported if they are meant to be used outside the module. Non-exported module-local symbols are not declared @private. There is no prescribed ordering for exported and module-local symbols.
- Use named exports in all code. You can apply the export keyword to a declaration, or use the export {name}; syntax.
- Do not use default exports. Importing modules must give a name to these values, which can lead to inconsistencies in naming across modules.
- // Do not use default exports: export default class Foo { ... } // BAD! // Use named exports: export class Foo { ... } // Alternate style named exports: class Foo { ... } export {Foo};
- Exported variables must not be mutated outside of module initialization.
- There are alternatives if mutation is needed, including exporting a constant reference to an object that has mutable fields or exporting accessor functions for mutable data.
- export from statements must not be line wrapped and are therefore an exception to the 80-column limit. This applies to both export from flavors.
#### 3.4.3 Circular Dependencies in ES modules

- Do not create cycles between ES modules, even though the ECMAScript specification allows this. Note that it is possible to create cycles with both the import and export statements.
- // a.js import './b.js'; // b.js import './a.js'; // `export from` can cause circular dependencies too! export {x} from './c.js'; // c.js import './b.js'; export let x;
#### 3.4.4 Interoperating with Closure

- To reference the Closure goog namespace, import Closure's goog.js.
- import * as goog from '../closure/goog/goog.js'; const {compute} = goog.require('a.name'); export const CONSTANT = compute(); goog.js exports only a subset of properties from the global goog that can be used in ES modules.
- goog.require in ES modules works as it does in goog.module files. You can require any Closure namespace symbol (i.e., symbols created by goog.provide or goog.module) and goog.require will return the value.
- import * as goog from '../closure/goog/goog.js'; import * as anEsModule from './anEsModule.js'; const GoogPromise = goog.require('goog.Promise'); const myNamespace = goog.require('my.namespace');
- goog.declareModuleId can be used within ES modules to declare a goog.module-like module ID. This means that this module ID can be goog.required, goog.module.getd etc. as if it were a goog.module that did not call goog.module.declareLegacyNamespace. It does not create the module ID as a globally available JavaScript symbol.
- A goog.require (or goog.module.get) for a module ID from goog.declareModuleId will always return the module object (as if it was import *'d). As a result, the argument to goog.declareModuleId should always end with a lowerCamelCaseName.
- goog.declareModuleId should only be used to upgrade Closure files to ES modules in place, where named exports are used.
#### 3.5 goog.setTestOnly

- In a goog.module file the goog.module statement and, if present, goog.module.declareLegacyNamespace() statement may optionally be followed by a call to goog.setTestOnly().
- In an ES module the import statements may optionally be followed by a call to goog.setTestOnly().
#### 3.6 goog.require and goog.requireType statements

- Imports are done with goog.require and goog.requireType statements. The names imported by a goog.require statement may be used both in code and in type annotations, while those imported by a goog.requireType may be used in type annotations only.
- The goog.require and goog.requireType statements form a contiguous block with no empty lines. This block follows the goog.module declaration separated by a single empty line. The entire argument to goog.require or goog.requireType is a namespace defined by a goog.module in a separate file. goog.require and goog.requireType statements may not appear anywhere else in the file.
- Each goog.require or goog.requireType is assigned to a single constant alias, or else destructured into several constant aliases. These aliases are the only acceptable way to refer to dependencies in type annotations or code. Fully qualified namespaces must not be used anywhere, except as an argument to goog.require or goog.requireType.
- Exception: Types, variables, and functions declared in externs files have to use their fully qualified name in type annotations and code.
- When goog.require is assigned to a single constant alias, it must match the final dot-separated component of the imported module's namespace.
- A file should not contain both a goog.require and a goog.requireType statement for the same namespace. If the imported name is used both in code and in type annotations, it should be imported by a single goog.require statement.
- If a module is imported only for its side effects, the call must be a goog.require (not a goog.requireType) and assignment may be omitted. A comment is required to explain why this is needed and suppress a compiler warning.
- The lines are sorted according to the following rules: All requires with a name on the left hand side come first, sorted alphabetically by those names. Then destructuring requires, again sorted by the names on the left hand side. Finally, any require calls that are standalone (generally these are for modules imported just for their side effects).
- If a long alias or module name would cause a line to exceed the 80-column limit, it must not be wrapped: require lines are an exception to the 80-column limit.
#### 3.7 The file’s implementation

- The actual implementation follows after all dependency information is declared (separated by at least one blank line).
- This may consist of any module-local declarations (constants, variables, classes, functions, etc), as well as any exported symbols.
### 4 Formatting

- Terminology Note: block-like construct refers to the body of a class, function, method, or brace-delimited block of code. Note that, by ?? and ??, any array or object literal may optionally be treated as if it were a block-like construct.
#### 4.1.1 Braces are used for all control structures

- Braces are required for all control structures (i.e. if, else, for, do, while, as well as any others), even if the body contains only a single statement. The first statement of a non-empty block must begin on its own line.
- if (someVeryLongCondition()) doSomething(); for (let i = 0; i < foo.length; i++) bar(foo[i]); Exception: A simple if statement that can fit entirely on a single line with no wrapping (and that doesn’t have an else) may be kept on a single line with no braces when it improves readability. This is the only case in which a control structure may omit braces and newlines.
#### 4.1.2 Nonempty blocks: K&R style

- No line break before the opening brace.
- Line break after the opening brace.
- Line break before the closing brace.
- Line break after the closing brace if that brace terminates a statement or the body of a function or class statement, or a class method. Specifically, there is no line break after the brace if it is followed by else, catch, while, or a comma, semicolon, or right-parenthesis.
- Braces follow the Kernighan and Ritchie style (Egyptian brackets) for nonempty blocks and block-like constructs:
#### 4.1.3 Empty blocks: may be concise

- An empty block or block-like construct may be closed immediately after it is opened, with no characters, space, or line break in between (i.e. {}), unless it is a part of a multi-block statement (one that directly contains multiple blocks: if/else or try/catch/finally).
#### 4.2 Block indentation: +2 spaces

- Each time a new block or block-like construct is opened, the indent increases by two spaces. When the block ends, the indent returns to the previous indent level. The indent level applies to both code and comments throughout the block. (See the example in ??).
#### 4.2.1 Array literals: optionally block-like

- Any array literal may optionally be formatted as if it were a “block-like construct.” For example, the following are all valid (not an exhaustive list):
- const a = [ 0, 1, 2, ]; const b = [0, 1, 2]; const c = [0, 1, 2]; someMethod(foo, [ 0, 1, 2, ], bar); Other combinations are allowed, particularly when emphasizing semantic groupings between elements, but should not be used only to reduce the vertical size of larger arrays.
#### 4.2.2 Object literals: optionally block-like

- Any object literal may optionally be formatted as if it were a “block-like construct.” The same examples apply as ??. For example, the following are all valid (not an exhaustive list):
#### 4.2.4 Function expressions

- When declaring an anonymous function in the list of arguments for a function call, the body of the function is indented two spaces more than the preceding indentation depth.
#### 4.2.5 Switch statements

- As with any other block, the contents of a switch block are indented +2.
- After a switch label, a newline appears, and the indentation level is increased +2, exactly as if a block were being opened. An explicit block may be used if required by lexical scoping. The following switch label returns to the previous indentation level, as if a block had been closed.
- A blank line is optional between a break and the following case.
#### 4.3.1 One statement per line

- Each statement is followed by a line-break.
#### 4.3.2 Semicolons are required

- Every statement must be terminated with a semicolon. Relying on automatic semicolon insertion is forbidden.
#### 4.4 Column limit: 80

- goog.module, goog.require and goog.requireType statements (see ?? and ??).
- ES module import and export from statements (see ?? and ??).
- Lines where obeying the column limit is not possible or would hinder discoverability. Examples include: A long URL which should be clickable in source.
- A shell command intended to be copied-and-pasted.
- A long string literal which may need to be copied or searched for wholly (e.g., a long file path).
- JavaScript code has a column limit of 80 characters. Except as noted below, any line that would exceed this limit must be line-wrapped, as explained in ??.
#### 4.5 Line-wrapping

- Terminology Note: Line wrapping is breaking a chunk of code into multiple lines to obey column limit, where the chunk could otherwise legally fit in a single line.
- There is no comprehensive, deterministic formula showing exactly how to line-wrap in every situation. Very often there are several valid ways to line-wrap the same piece of code.
