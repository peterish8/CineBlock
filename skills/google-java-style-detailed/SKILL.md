---
name: google-java-style-detailed
description: Comprehensive Google Java style rules with section-level guidance. Use when google-java-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Java Style (Detailed)

Source: [https://google.github.io/styleguide/javaguide.html](https://google.github.io/styleguide/javaguide.html)

Pair with the quick reference: [google-java-style](../google-java-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-java-style](../google-java-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

### 1 Introduction

- This document serves as the complete definition of Google's coding standards for source code in the Java™ Programming Language. A Java source file is described as being in Google Style if and only if it adheres to the rules herein.
- Like other programming style guides, the issues covered span not only aesthetic issues of formatting, but other types of conventions or coding standards as well. However, this document focuses primarily on the hard-and-fast rules that we follow universally, and avoids giving advice that isn't clearly enforceable (whether by human or tool).
#### 1.1 Terminology notes

- The term class is used inclusively to mean a normal class, record class, enum class, interface or annotation type (@interface).
- The term member (of a class) is used inclusively to mean a nested class, field, method, or constructor; that is, all top-level contents of a class except initializers.
- The term comment always refers to implementation comments. We do not use the phrase "documentation comments", and instead use the common term "Javadoc."
- In this document, unless otherwise clarified:
- Other "terminology notes" will appear occasionally throughout the document.
#### 2.1 File name

- For a source file containing classes, the file name consists of the case-sensitive name of the top-level class (of which there is exactly one), plus the .java extension.
#### 2.2 File encoding: UTF-8

- Source files are encoded in UTF-8.
#### 2.3.1 Whitespace characters

- All other whitespace characters are escaped in char and string literals and in text blocks.
- Tab characters are not used for indentation.
- Aside from the line terminator sequence, the ASCII horizontal space character (0x20) is the only whitespace character that appears anywhere in a source file. This implies that:
#### 2.3.2 Special escape sequences

- For any character that has a special escape sequence (\b, \t, \n, \f, \r, \s, \", \' and \\), that sequence is used rather than the corresponding octal (e.g. \012) or Unicode (e.g. \u000a) escape.
#### 2.3.3 Non-ASCII characters

- For the remaining non-ASCII characters, either the actual Unicode character (e.g. ∞) or the equivalent Unicode escape (e.g. \u221e) is used. The choice depends only on which makes the code easier to read and understand, although Unicode escapes outside string literals and comments are strongly discouraged.
### 3 Source file structure

- License or copyright information, if present
- Exactly one top-level class declaration
- An ordinary source file consists of these sections, in order:
- Exactly one blank line separates each section that is present.
- A package-info.java file is the same, but without the class declaration.
- A module-info.java file does not contain a package declaration and replaces the class declaration with a module declaration, but otherwise follows the same structure.
#### 3.1 License or copyright information, if present

- If license or copyright information belongs in a file, it belongs here.
#### 3.2 Package declaration

- Every source file must have a package declaration. Compact source files are not used. (This rule obviously does not apply to module-info.java files, which have a different syntax that does not include a package declaration.)
- The package declaration is not line-wrapped. The column limit (Section 4.4, Column limit: 100) does not apply to package declarations.
#### 3.3.1 No wildcard imports

- Wildcard ("on-demand") imports, static or otherwise, are not used.
#### 3.3.1.1 No module imports

- Module imports are not used.
#### 3.3.2 No line-wrapping

- Imports are not line-wrapped. The column limit (Section 4.4, Column limit: 100) does not apply to imports.
#### 3.3.3 Ordering and spacing

- All static imports in a single group.
- All non-static imports in a single group.
- If there are both static and non-static imports, a single blank line separates the two groups. There are no other blank lines between imports.
- Within each group the imported names appear in ASCII sort order. (Note: this is not the same as the import lines being in ASCII sort order, since '.' sorts before ';'.)
#### 3.3.4 No static import for classes

- Static import is not used for static nested classes. They are imported with normal imports.
#### 3.4.1 Exactly one top-level class declaration

- Each top-level class resides in a source file of its own.
#### 3.4.2 Ordering of class contents

- The order you choose for the members and initializers of your class can have a great effect on learnability. However, there's no single correct recipe for how to do it; different classes may order their contents in different ways.
- What is important is that each class uses some logical order, which its maintainer could explain if asked. For example, new methods are not just habitually added to the end of the class, as that would yield "chronological by date added" ordering, which is not a logical ordering.
- Methods of a class that share the same name appear in a single contiguous group with no other members in between. The same applies to multiple constructors. This rule applies even when modifiers such as static or private differ between the methods or constructors.
#### 3.5.1 Ordering and spacing of module directives

- All requires directives in a single block.
- All exports directives in a single block.
- All opens directives in a single block.
- All uses directives in a single block.
- All provides directives in a single block.
- Module directives are ordered as follows:
- A single blank line separates each block that is present.
### 4 Formatting

- Terminology Note: block-like construct refers to the body of a class, method, constructor, or switch. Note that, by Section 4.8.3.1 on array initializers, any array initializer may optionally be treated as if it were a block-like construct.
#### 4.1.1 Use of optional braces

- Braces are used with if, else, for, do and while statements, even when the body is empty or contains only a single statement.
- Other optional braces, such as those in a lambda expression, remain optional.
#### 4.1.2 Nonempty blocks: K & R style

- No line break before the opening brace, except as detailed below.
- Line break after the opening brace.
- Line break before the closing brace.
- Line break after the closing brace, only if that brace terminates a statement or terminates the body of a method, constructor, or named class. For example, there is no line break after the brace if it is followed by else or a comma.
- Braces follow the Kernighan and Ritchie style for nonempty blocks and block-like constructs:
- Exception: In places where these rules allow a single statement ending with a semicolon (;), a block of statements can appear, and the opening brace of this block is preceded by a line break. Blocks like these are typically introduced to limit the scope of local variables.
- return () -> { while (condition()) { method(); } }; return new MyClass() { @Override public void method() { if (condition()) { try { something(); } catch (ProblemException e) { recover(); } } else if (otherCondition()) { somethingElse(); } else { lastThing(); } { int x = foo(); frob(x); } } }; A few exceptions for enum classes are given in Section 4.8.1, Enum classes.
#### 4.1.3 Empty blocks: may be concise

- An empty block or block-like construct may be in K & R style (as described in Section 4.1.2). Alternatively, it may be closed immediately after it is opened, with no characters or line break in between ({}), unless it is part of a multi-block statement (one that directly contains multiple blocks: if/else or try/catch/finally).
#### 4.2 Block indentation: +2 spaces

- Each time a new block or block-like construct is opened, the indent increases by two spaces. When the block ends, the indent returns to the previous indent level. The indent level applies to both code and comments throughout the block. (See the example in Section 4.1.2, Nonempty blocks: K & R Style.)
#### 4.3 One statement per line

- Each statement is followed by a line break.
#### 4.4 Column limit: 100

- Lines where obeying the column limit is not possible (for example, a long URL in Javadoc, or a long JSNI method reference).
- package declarations and imports (see Sections 3.2 Package declarations and 3.3 Imports).
- Contents of text blocks.
- Command lines in a comment that may be copied-and-pasted into a shell.
- Very long identifiers, on the rare occasions they are called for, are allowed to exceed the column limit. In that case, the valid wrapping for the surrounding code is as produced by google-java-format.
- Java code has a column limit of 100 characters. A "character" means any Unicode code point. Except as noted below, any line that would exceed this limit must be line-wrapped, as explained in Section 4.5, Line-wrapping.
- Each Unicode code point counts as one character, even if its display width is greater or less. For example, if using fullwidth characters, you may choose to wrap the line earlier than where this rule strictly requires.
#### 4.5 Line-wrapping

- Terminology Note: When code that might otherwise occupy a single line is divided into multiple lines, this activity is called line-wrapping.
- There is no comprehensive, deterministic formula showing exactly how to line-wrap in every situation. Very often there are several valid ways to line-wrap the same piece of code.
#### 4.5.1 Where to break

- When a line is broken at a non-assignment operator the break comes before the symbol. (Note that this is not the same practice used in Google style for other languages, such as C++ and JavaScript.) This also applies to the following "operator-like" symbols: the dot separator (.)
- the two colons of a method reference (::)
- an ampersand in a type bound (<T extends Foo & Bar>)
- a pipe in a catch block (catch (FooException | BarException e)).
- When a line is broken at an assignment operator the break typically comes after the symbol, but either way is acceptable. This also applies to the colon in an enhanced for ("foreach") statement.
- A method, constructor, or record-class name stays attached to the open parenthesis (() that follows it.
- A comma (,) stays attached to the token that precedes it.
- A line is never broken adjacent to the arrow in a lambda or a switch rule, except that a break may come immediately after the arrow if the text following it consists of a single unbraced expression. Examples: MyLambda<String, Long, Object> lambda = (String label, Long value, Object obj) -> { ... }; Predicate<String> predicate = str -> longExpressionInvolving(str); switch (x) { case ColorPoint(Color color, Point(int x, int y)) -> handleColorPoint(color, x, y); ... }
- The prime directive of line-wrapping is: prefer to break at a higher syntactic level. Also:
- MyLambda<String, Long, Object> lambda = (String label, Long value, Object obj) -> { ... }; Predicate<String> predicate = str -> longExpressionInvolving(str); switch (x) { case ColorPoint(Color color, Point(int x, int y)) -> handleColorPoint(color, x, y); ... } Note: The primary goal for line wrapping is to have clear code, not necessarily code that fits in the smallest number of lines.
#### 4.5.2 Indent continuation lines at least +4 spaces

- When line-wrapping, each line after the first (each continuation line) is indented at least +4 from the original line.
- When there are multiple continuation lines, indentation may be varied beyond +4 as desired. In general, two continuation lines use the same indentation level if and only if they begin with syntactically parallel elements.
- Section 4.6.3 on Horizontal alignment addresses the discouraged practice of using a variable number of spaces to align certain tokens with previous lines.
#### 4.6.1 Vertical whitespace (blank lines)

- Between consecutive members or initializers of a class: fields, constructors, methods, nested classes, static initializers, and instance initializers. Exception: A blank line between two consecutive fields (having no other code between them) is optional. Such blank lines are used as needed to create logical groupings of fields.
- Exception: Blank lines between enum constants are covered in Section 4.8.1.
- As required by other sections of this document (such as Section 3, Source file structure, and Section 3.3, Imports).
- A single blank line may also appear anywhere it improves readability, for example between statements to organize the code into logical subsections. A blank line before the first member or initializer, or after the last member or initializer of the class, is neither encouraged nor discouraged.
- Multiple consecutive blank lines are permitted, but never required (or encouraged).
#### 4.6.2 Horizontal whitespace

- Separating any keyword, such as if, for or catch, from an open parenthesis (() that follows it on that line
- Separating any keyword, such as else or catch, from a closing curly brace (}) that precedes it on that line
- Before any open curly brace ({), with two exceptions: @SomeAnnotation({a, b}) (no space is used)
- String[][] x = {{"foo"}}; (no space is required between {{, by item 10 below)
- On both sides of any binary or ternary operator. This also applies to the following "operator-like" symbols: the ampersand that separates multiple type bounds: <T extends Foo & Bar>
- the pipe for a catch block that handles multiple exceptions: catch (FooException | BarException e)
- the colon (:) in an enhanced for ("foreach") statement
- the arrow in a lambda expression: (String str) -> str.length() or switch rule: case "FOO" -> bar();
- the two colons (::) of a method reference, which is written like Object::toString
- the dot separator (.), which is written like object.toString()
#### 4.6.3 Horizontal alignment: never required

- Terminology Note: Horizontal alignment is the practice of adding a variable number of additional spaces in your code with the goal of making certain tokens appear directly below certain other tokens on previous lines.
- This practice is permitted, but is never required by Google Style. It is not even required to maintain horizontal alignment in places where it was already used.
- Here is an example without alignment, then using alignment:
#### 4.7 Grouping parentheses: recommended

- Optional grouping parentheses are omitted only when author and reviewer agree that there is no reasonable chance the code will be misinterpreted without them, nor would they have made the code easier to read. It is not reasonable to assume that every reader has the entire Java operator precedence table memorized.
#### 4.8.1 Enum classes

- After the comma that follows an enum constant, a line break is optional. Additional blank lines (usually just one) are also allowed. This is one possibility:
- private enum Answer { YES { @Override public String toString() { return "yes"; } }, NO, MAYBE } An enum class with no methods and no documentation on its constants may optionally be formatted as if it were an array initializer (see Section 4.8.3.1 on array initializers).
- private enum Suit { CLUBS, HEARTS, SPADES, DIAMONDS } Since enum classes are classes, all other rules for formatting classes apply.
#### 4.8.2 Variable declarations

- Every variable declaration (field or local) declares only one variable: declarations such as int a, b; are not used.
- Exception: Multiple variable declarations are acceptable in the header of a for loop.
- Local variables are not habitually declared at the start of their containing block or block-like construct. Instead, local variables are declared close to the point they are first used (within reason), to minimize their scope. Local variable declarations typically have initializers, or are initialized immediately after declaration.
#### 4.8.3 Arrays

- Any array initializer may optionally be formatted as if it were a "block-like construct." For example, the following are all valid (not an exhaustive list):
- new int[] { new int[] { 0, 1, 2, 3 0, } 1, 2, new int[] { 3, 0, 1, } 2, 3 } new int[] {0, 1, 2, 3} 4.8.3.2 No C-style array declarations The square brackets form a part of the type, not the variable: String[] args, not String args[].
