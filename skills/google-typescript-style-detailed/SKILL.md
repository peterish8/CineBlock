---
name: google-typescript-style-detailed
description: Comprehensive Google TypeScript style rules with section-level guidance. Use when google-typescript-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google TypeScript Style (Detailed)

Source: [https://google.github.io/styleguide/tsguide.html](https://google.github.io/styleguide/tsguide.html)

Pair with the quick reference: [google-typescript-style](../google-typescript-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-typescript-style](../google-typescript-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

#### Terminology notes

- This Style Guide uses RFC 2119 terminology when using the phrases must, must not, should, should not, and may. The terms prefer and avoid correspond to should and should not, respectively. Imperative and declarative statements are prescriptive and correspond to must.
#### Guide notes

- All examples given are non-normative and serve only to illustrate the normative language of the style guide. That is, while the examples are in Google Style, they may not illustrate the only stylish way to represent the code. Optional formatting choices made in examples must not be enforced as rules.
#### File encoding: UTF-8

- Source files are encoded in UTF-8.
#### Whitespace characters

- Aside from the line terminator sequence, the ASCII horizontal space character (0x20) is the only whitespace character that appears anywhere in a source file. This implies that all other whitespace characters in string literals are escaped.
#### Special escape sequences

- For any character that has a special escape sequence (\', \", \\, \b, \f, \n, \r, \t, \v), that sequence is used rather than the corresponding numeric escape (e.g \x0a, \u000a, or \u{a}). Legacy octal escapes are never used.
#### Non-ASCII characters

- For the remaining non-ASCII characters, use the actual Unicode character (e.g. ∞). For non-printable characters, the equivalent hex or Unicode escapes (e.g. \u221e) can be used along with an explanatory comment.
- // Perfectly clear, even without a comment. const units = 'μs'; // Use escapes for non-printable characters. const output = '\ufeff' + content; // byte order mark // Hard to read and prone to mistakes, even with the comment. const units = '\u03bcs'; // Greek letter mu, 's' // The reader has no idea what this is. const output = '\ufeff' + content;
### Source file structure

- Copyright information, if present
- JSDoc with @fileoverview, if present
- The file’s implementation
- Files consist of the following, in order:
- Exactly one blank line separates each section that is present.
#### Copyright information

- If license or copyright information is necessary in a file, add it in a JSDoc at the top of the file.
#### @fileoverview JSDoc

- A file may have a top-level @fileoverview JSDoc. If present, it may provide a description of the file's content, its uses, or information about its dependencies. Wrapped lines are not indented.
#### Imports

- There are four variants of import statements in ES6 and TypeScript:
#### Import paths

- TypeScript code must use paths to import other TypeScript code. Paths may be relative, i.e. starting with . or .., or rooted at the base directory, e.g. root/path/to/file.
- Code should use relative imports (./foo) rather than absolute imports path/to/foo when referring to files within the same (logical) project as this allows to move the project around without introducing changes in these imports.
- Consider limiting the number of parent steps (../../../) as those can make module and path structures hard to understand.
- import {Symbol1} from 'path/from/root'; import {Symbol2} from '../parent/file'; import {Symbol3} from './sibling';
#### Namespace versus named imports

- Both namespace and named imports can be used.
- Prefer named imports for symbols used frequently in a file or for symbols that have clear names, for example Jasmine's describe and it. Named imports can be aliased to clearer names as needed with as.
- Prefer namespace imports when using many different symbols from large APIs. A namespace import, despite using the * character, is not comparable to a wildcard import as seen in other languages. Instead, namespace imports give a name to all the exports of a module, and each exported symbol from the module becomes a property on the module name. Namespace imports can aid readability for exported symbols that have common names like Model or Controller without the need to declare aliases.
- This rule exists to aid in build performance and dead code elimination since often .proto files contain many messages that are not all needed together. By leveraging destructured imports the build system can create finer grained dependencies on Apps JSPB messages while preserving the ergonomics of path based imports.
#### Renaming imports

- If it's necessary to avoid collisions with other imported symbols.
- If the imported symbol name is generated.
- If importing symbols whose names are unclear by themselves, renaming can improve code clarity. For example, when using RxJS the from function might be more readable when renamed to observableFrom.
- Code should fix name collisions by using a namespace import or renaming the exports themselves. Code may rename imports (import {SomeThing as SomeOtherThing}) if needed.
- Three examples where renaming can be helpful:
#### Exports

- // Use named exports: export class Foo { ... } Do not use default exports. This ensures that all imports follow a uniform pattern.
- // Do not use default exports: export default class Foo { ... } // BAD! Why?
- Default exports provide no canonical name, which makes central maintenance difficult with relatively little benefit to code owners, including potentially decreased readability:
- import Foo from './bar'; // Legal. import Bar from './bar'; // Also legal. Named exports have the benefit of erroring when import statements try to import something that hasn't been declared. In foo.ts:
- const foo = 'blah'; export default foo; And in bar.ts:
- import {fizz} from './foo'; Results in error TS2614: Module '"./foo"' has no exported member 'fizz'. While bar.ts:
- import fizz from './foo'; Results in fizz === foo, which is probably unexpected and difficult to debug.
- Additionally, default exports encourage people to put everything into one big object to namespace it all together:
- export default class Foo { static SOME_CONSTANT = ... static someHelpfulFunction() { ... } ... } With the above pattern, we have file scope, which can be used as a namespace. We also have a perhaps needless second scope (the class Foo) that can be ambiguously used as both a type and a value in other files.
- Instead, prefer use of file scope for namespacing, as well as named exports:
#### Export visibility

- TypeScript does not support restricting the visibility for exported symbols. Only export symbols that are used outside of the module. Generally minimize the exported API surface of modules.
#### Mutable exports

- Regardless of technical support, mutable exports can create hard to understand and debug code, in particular with re-exports across multiple modules. One way to paraphrase this style point is that export let is not allowed.
- export let foo = 3; // In pure ES6, foo is mutable and importers will observe the value change after a second. // In TS, if foo is re-exported by a second file, importers will not see the value change. window.setTimeout(() => { foo = 4; }, 1000 /* ms */); If one needs to support externally accessible and mutable bindings, they should instead use explicit getter functions.
- let foo = 3; window.setTimeout(() => { foo = 4; }, 1000 /* ms */); // Use an explicit getter to access the mutable export. export function getFoo() { return foo; }; For the common pattern of conditionally exporting either of two values, first do the conditional check, then the export. Make sure that all exports are final after the module's body has executed.
- function pickApi() { if (useOtherApi()) return OtherApi; return RegularApi; } export const SomeApi = pickApi();
#### Container classes

- Do not create container classes with static methods or properties for the sake of namespacing.
- export class Container { static FOO = 1; static bar() { return 1; } } Instead, export individual constants and functions:
#### Import type

- In development mode, we typically want quick iteration loops. The compiler transpiles to JavaScript without full type information. This is much faster, but requires import type in certain cases.
- In production mode, we want correctness. The compiler type checks everything and ensures import type is used correctly.
- You may use import type {...} when you use the imported symbol only as a type. Use regular imports for values:
- import type {Foo} from './foo'; import {Bar} from './foo'; import {type Foo, Bar} from './foo'; Why?
- The TypeScript compiler automatically handles the distinction and does not insert runtime loads for type references. So why annotate type imports?
- The TypeScript compiler can run in 2 modes:
#### Export type

- Use export type when re-exporting a type, e.g.:
- export type {AnInterface} from './foo'; Why?
- export type is useful to allow type re-exports in file-by-file transpilation. See isolatedModules docs.
- export type might also seem useful to avoid ever exporting a value symbol for an API. However it does not give guarantees, either: downstream code might still import an API through a different path. A better way to split & guarantee type vs value usages of an API is to actually split the symbols into e.g. UserService and AjaxUserService. This is less error prone and also better communicates intent.
#### Use modules not namespaces

- TypeScript supports two methods to organize code: namespaces and modules, but namespaces are disallowed. That is, your code must refer to code in other files using imports and exports of the form import {foo} from 'bar';
- Your code must not use the namespace Foo { ... } construct. namespaces may only be used when required to interface with external, third party code. To semantically namespace your code, use separate files.
- Code must not use require (as in import x = require('...');) for imports. Use ES6 module syntax.
- // Bad: do not use namespaces: namespace Rocket { function launch() { ... } } // Bad: do not use <reference> /// <reference path="..."/> // Bad: do not use require() import x = require('mydep'); NB: TypeScript namespaces used to be called internal modules and used to use the module keyword in the form module Foo { ... }. Don't use that either. Always use ES6 imports.
### Language features

- This section delineates which features may or may not be used, and any additional constraints on their use.
- Language features which are not discussed in this style guide may be used with no recommendations of their usage.
#### Use const and let

- Always use const or let to declare variables. Use const by default, unless a variable needs to be reassigned. Never use var.
- const foo = otherValue; // Use if "foo" never changes. let bar = someValue; // Use if "bar" is ever assigned into later on. const and let are block scoped, like variables in most other languages. var in JavaScript is function scoped, which can cause difficult to understand bugs. Don't use it.
- var foo = someValue; // Don't use - var scoping is complex and causes bugs. Variables must not be used before their declaration.
#### One variable per declaration

- Every local variable declaration declares only one variable: declarations such as let a = 1, b = 2; are not used.
#### Do not use the Array constructor

- Do not use the Array() constructor, with or without new. It has confusing and contradictory usage:
- const a = new Array(2); // [undefined, undefined] const b = new Array(2, 3); // [2, 3]; Instead, always use bracket notation to initialize arrays, or from to initialize an Array with a certain size:
- const a = [2]; const b = [2, 3]; // Equivalent to Array(2): const c = []; c.length = 2; // [0, 0, 0, 0, 0] Array.from<number>({length: 5}).fill(0);
#### Do not define properties on arrays

- Do not define or use non-numeric properties on an array (other than length). Use a Map (or Object) instead.
#### Using spread syntax

- Using spread syntax [...foo]; is a convenient shorthand for shallow-copying or concatenating iterables.
- const foo = [ 1, ]; const foo2 = [ ...foo, 6, 7, ]; const foo3 = [ 5, ...foo, ]; foo2[1] === 6; foo3[1] === 1; When using spread syntax, the value being spread must match what is being created. When creating an array, only spread iterables. Primitives (including null and undefined) must not be spread.
- const foo = [7]; const bar = [5, ...(shouldUseFoo && foo)]; // might be undefined // Creates {0: 'a', 1: 'b', 2: 'c'} but has no length const fooStrings = ['a', 'b', 'c']; const ids = {...fooStrings}; const foo = shouldUseFoo ? [7] : []; const bar = [5, ...foo]; const fooStrings = ['a', 'b', 'c']; const ids = [...fooStrings, 'd', 'e'];
#### Array destructuring

- Array literals may be used on the left-hand side of an assignment to perform destructuring (such as when unpacking multiple values from a single array or iterable). A final rest element may be included (with no space between the ... and the variable name). Elements should be omitted if they are unused.
- const [a, b, c, ...rest] = generateResults(); let [, b,, d] = someArray; Destructuring may also be used for function parameters. Always specify [] as the default value if a destructured array parameter is optional, and provide default values on the left hand side:
- function destructured([a = 4, b = 2] = []) { … } Disallowed:
- function badDestructuring([a, b] = [4, 2]) { … } Tip: For (un)packing multiple values into a function’s parameter or return, prefer object destructuring to array destructuring when possible, as it allows naming the individual elements and specifying a different type for each.
#### Do not use the Object constructor

- The Object constructor is disallowed. Use an object literal ({} or {a: 0, b: 1, c: 2}) instead.
#### Iterating objects

- Iterating objects with for (... in ...) is error prone. It will include enumerable properties from the prototype chain.
- Do not use unfiltered for (... in ...) statements:
- for (const x in someObj) { // x could come from some parent prototype! } Either filter values explicitly with an if statement, or use for (... of Object.keys(...)).
- for (const x in someObj) { if (!someObj.hasOwnProperty(x)) continue; // now x was definitely defined on someObj } for (const x of Object.keys(someObj)) { // note: for _of_! // now x was definitely defined on someObj } for (const [key, value] of Object.entries(someObj)) { // note: for _of_! // now key was definitely defined on someObj }
#### Computed property names

- Computed property names (e.g. {['key' + foo()]: 42}) are allowed, and are considered dict-style (quoted) keys (i.e., must not be mixed with non-quoted keys) unless the computed property is a symbol (e.g. [Symbol.iterator]).
#### Object destructuring

- Object destructuring patterns may be used on the left-hand side of an assignment to perform destructuring and unpack multiple values from a single object.
- Destructured objects may also be used as function parameters, but should be kept as simple as possible: a single level of unquoted shorthand properties. Deeper levels of nesting and computed properties may not be used in parameter destructuring. Specify any default values in the left-hand-side of the destructured parameter ({str = 'some default'} = {}, rather than {str} = {str: 'some default'}), and if a destructured object is itself optional, it must default to {}.
- interface Options { /** The number of times to do something. */ num?: number; /** A string to do stuff to. */ str?: string; } function destructured({num, str = 'default'}: Options = {}) {} Disallowed:
- function nestedTooDeeply({x: {num, str}}: {x: Options}) {} function nontrivialDefault({num, str}: Options = {num: 42, str: 'default'}) {}
#### Class declarations

- Class declarations must not be terminated with semicolons:
- class Foo { } class Foo { }; // Unnecessary semicolon In contrast, statements that contain class expressions must be terminated with a semicolon:
- export const Baz = class extends Bar { method(): number { return this.x; } }; // Semicolon here as this is a statement, not a declaration exports const Baz = class extends Bar { method(): number { return this.x; } } It is neither encouraged nor discouraged to have blank lines separating class declaration braces from other class content:
#### Class method declarations

- Class method declarations must not use a semicolon to separate individual method declarations:
- class Foo { doThing() { console.log("A"); } } class Foo { doThing() { console.log("A"); }; // <-- unnecessary } Method declarations should be separated from surrounding code by a single blank line:
- class Foo { doThing() { console.log("A"); } getOtherThing(): number { return 4; } } class Foo { doThing() { console.log("A"); } getOtherThing(): number { return 4; } }
- The toString method may be overridden, but must always succeed and never have visible side effects.
#### Static methods

- Where it does not interfere with readability, prefer module-local functions over private static methods.
- Code should not rely on dynamic dispatch of static methods. Static methods should only be called on the base class itself (which defines it directly). Static methods should not be called on variables containing a dynamic instance that may be either the constructor or a subclass constructor (and must be defined with @nocollapse if this is done), and must not be called directly on a subclass that doesn’t define the method itself.
- JavaScript allows accessing static fields through this. Different from other languages, static fields are also inherited.
- class ShoeStore { static storage: Storage = ...; static isAvailable(s: Shoe) { // Bad: do not use `this` in a static method. return this.storage.has(s.id); } } class EmptyShoeStore extends ShoeStore { static storage: Storage = EMPTY_STORE; // overrides storage from ShoeStore } Why?
- This code is generally surprising: authors might not expect that static fields can be accessed through the this pointer, and might be surprised to find that they can be overridden - this feature is not commonly used.
- This code also encourages an anti-pattern of having substantial static state, which causes problems with testability.
#### Constructors

- Constructor calls must use parentheses, even when no arguments are passed:
- const x = new Foo; const x = new Foo(); Omitting parentheses can lead to subtle mistakes. These two lines are not equivalent:
- new Foo().Bar(); new Foo.Bar(); It is unnecessary to provide an empty constructor or one that simply delegates into its parent class because ES2015 provides a default class constructor if one is not specified. However constructors with parameter properties, visibility modifiers or parameter decorators should not be omitted even if the body of the constructor is empty.
- class UnnecessaryConstructor { constructor() {} } class UnnecessaryConstructorOverride extends Base { constructor(value: number) { super(value); } } class DefaultConstructor { } class ParameterProperties { constructor(private myService) {} } class ParameterDecorators { constructor(@SideEffectDecorator myService) {} } class NoInstantiation { private constructor() {} } The constructor should be separated from surrounding code both above and below by a single blank line:
