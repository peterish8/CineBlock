---
name: google-objective-c-style-detailed
description: Comprehensive Google Objective-C style rules with section-level guidance. Use when google-objective-c-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google Objective-C Style (Detailed)

Source: [https://google.github.io/styleguide/objcguide.html](https://google.github.io/styleguide/objcguide.html)

Pair with the quick reference: [google-objective-c-style](../google-objective-c-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-objective-c-style](../google-objective-c-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

## import <Foundation/Foundation.h>

- A sample class demonstrating good Objective-C style. All interfaces,
- categories, and protocols (read: all non-trivial top-level declarations
- in a header) MUST be commented. Comments must also be adjacent to the
- object they're documenting.
- Convenience creation method.
- See -initWithBar: for details about @c bar.
- @param bar The string for fooing.
- @return An instance of Foo.
- Initializes and returns a Foo object using the provided Bar instance.
- @param bar A string that represents a thing that does a thing.
## import "Shared/Util/Foo.h"

- (instancetype)initWithBar:(Bar *)bar {
- (BOOL)doWorkWithBlah:(NSString *)blah {
#### Category Naming

- (nullable NSData *)gtm_encodedState;
#### Objective-C Method Names

- (void)addTarget:(id)target action:(SEL)action; // GOOD; no conjunction needed
- (CGPoint)convertPoint:(CGPoint)point fromView:(UIView *)view; // GOOD; conjunction clarifies parameter
- (Sandwich *)sandwich; // GOOD.
- (CGFloat)height; // GOOD.
- (CGFloat)calculateHeight; // AVOID.
- (id)theDelegate; // AVOID.
- (id)delegate; // GOOD.
- (id)getDelegate; // AVOID.
#### File Comments

- License boilerplate if necessary. Choose the appropriate boilerplate for the
- A basic description of the contents of the file if necessary.
#### Declaration Comments

- A delegate for NSApplication to handle notifications about app
- launch and shutdown. Owned by the main app controller.
- The background task in progress, if any. This is initialized
- to the value UIBackgroundTaskInvalid.
#### Approved Nonstandard Extensions

- The __attribute__ keyword is approved as it is used in Apple API
- The binary form of the conditional operator, A ?: B, is approved.
#### Avoid Messaging the Current Object Within Initializers and `-dealloc`

- Methods can be overridden in subclasses, either deliberately, or
- When editing a helper method, it may not be obvious that the code is being
#### Mutables, Copies and Ownership

- (NSArray *)listOfThings {
- (SomeProtoMessage *)someMessageForValue:(BOOL)value {
#### Copy Potentially Mutable Objects

- (void)setFilters:(NSSet<FilterThing *> *)filters {
- (NSArray<ContentThing *> *)currentContent {
- (void)setFooMessage:(FooMessage *)fooMessage {
- (FooMessage *)fooMessage {
- (void)doSomethingWithThings:(NSArray<Thing *> *)things {
#### Nullability

- (nonnull instancetype)initWithTitle:(nonnull NSString *)title
#### Method Declarations and Definitions

- (void)doSomethingWithString:(NSString *)theString {
#### Function Declarations and Definitions

- The opening parenthesis must always be on the same line as the function
- If you cannot fit the return type and the function name on a single line,
- There should never be a space before the opening parenthesis.
- There should never be a space between function parentheses and parameters.
- The open curly brace is always on the end of the last line of the function
- The close curly brace is either on the last line by itself or on the same
- There should be a space between the close parenthesis and the open curly
- All parameters should be aligned if possible.
- Function scopes should be indented 2 spaces.
- Wrapped parameters should have a 4 space indent.
