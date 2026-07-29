---
name: google-cpp-style-detailed
description: Comprehensive Google C++ style rules with section-level guidance. Use when google-cpp-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google C++ Style (Detailed)

Source: [https://google.github.io/styleguide/cppguide.html](https://google.github.io/styleguide/cppguide.html)

Pair with the quick reference: [google-cpp-style](../google-cpp-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-cpp-style](../google-cpp-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

#### Goals of the Style Guide

- Why do we have this document?
- The goals of the style guide as we currently see them are as follows:
### C++ Version

- Currently, code should target C++20, i.e., should not use C++23 features. The C++ version targeted by this guide will advance (aggressively) over time.
- Do not use non-standard extensions.
- Consider portability to other environments before using features from C++17 and C++20 in your project.
### Header Files

- In general, every .cc file should have an associated .h file. There are some common exceptions, such as unit tests and small .cc files containing just a main() function.
- Correct use of header files can make a huge difference to the readability, size and performance of your code.
- The following rules will guide you through the various pitfalls of using header files.
#### Self-contained Headers

- Header files should be self-contained (compile on their own) and end in .h. Non-header files that are meant for inclusion should end in .inc and be used sparingly.
- All header files should be self-contained. Users and refactoring tools should not have to adhere to special conditions to include the header. Specifically, a header should have header guards and include all other headers it needs.
- There are rare cases where a file designed to be included is not self-contained. These are typically intended to be included at unusual locations, such as the middle of another file. They might not use header guards, and might not include their prerequisites. Name such files with the .inc extension. Use sparingly, and prefer self-contained headers when possible.
#### The #define Guard

- All header files should have #define guards to prevent multiple inclusion. The format of the symbol name should be <PROJECT>_<PATH>_<FILE>_H_.
- To guarantee uniqueness, they should be based on the full path in a project's source tree. For example, the file foo/src/bar/baz.h in project foo should have the following guard:
#### Include What You Use

- If a source or header file refers to a symbol defined elsewhere, the file should directly include a header file which properly intends to provide a declaration or definition of that symbol. It should not include header files for any other reason.
- Do not rely on transitive inclusions. This allows people to remove no-longer-needed #include statements from their headers without breaking clients. This also applies to related headers - foo.cc should include bar.h if it uses a symbol from it even if foo.h includes bar.h.
#### Forward Declarations

- Forward declarations can save compile time, as #includes force the compiler to open more files and process more input.
- Forward declarations can save on unnecessary recompilation. #includes can force your code to be recompiled more often, due to unrelated changes in the header.
- Forward declarations can hide a dependency, allowing user code to skip necessary recompilation when headers change.
- A forward declaration as opposed to an #include statement makes it difficult for automatic tooling to discover the module defining the symbol.
- A forward declaration may be broken by subsequent changes to the library. Forward declarations of functions and templates can prevent the header owners from making otherwise-compatible changes to their APIs, such as widening a parameter type, adding a template parameter with a default value, or migrating to a new namespace.
- Forward declaring symbols from namespace std:: yields undefined behavior.
- It can be difficult to determine whether a forward declaration or a full #include is needed. Replacing an #include with a forward declaration can silently change the meaning of code: // b.h: struct B {}; struct D : B {}; // good_user.cc: #include "b.h" void f(B*); void f(void*); void test(D* x) { f(x); } // Calls f(B*) If the #include was replaced with forward decls for B and D, test() would call f(void*).
- Forward declaring multiple symbols from a header can be more verbose than simply #includeing the header.
- Structuring code to enable forward declarations (e.g., using pointer members instead of object members) can make the code slower and more complex.
- Try to make the header for a declaration cheap enough to easily include it directly.
#### Defining Functions in Header Files

- A textually inline symbol's definition is exposed to the reader at the point of declaration.
- A function or variable defined in a header file is expandable inline since its definition is available for inline expansion by the compiler, which can lead to more efficient object code.
- ODR-safe entities do not violate the "One Definition Rule", which often requires the inline keyword for things defined in header files .
- Defining a function textually in-line reduces boilerplate code for simple functions like accessors and mutators.
- As noted above, function definitions in header files can lead to more efficient object code for small functions due to inline expansion by the compiler.
- Function templates and constexpr functions generally need to be defined in the header file that declares them (but not necessarily the public part).
- Embedding a function definition in the public API makes the API harder to skim, and incurs cognitive overhead for readers of that API- the more complex the function the higher the cost.
- Public definitions expose implementation details that are at best harmless and often extraneous.
- Include the definition of a function at its point of declaration in a header file only when the definition is short. If the definition otherwise has a reason be in the header, put it in an internal part of the file. If necessary to make the definition ODR-safe, mark it with an inline specifier.
- Functions defined in header files are sometimes referred to as "inline functions", which is a somewhat overloaded term that refers to several distinct but overlapping situations:
#### Names and Order of Includes

- C and C++ standard library headers (e.g., <stdlib.h> and <string>).
- POSIX, Linux, and Windows system headers (e.g., <unistd.h> and <windows.h>).
- In rare cases, third_party libraries (e.g., <Python.h>).
- C system headers, and any other headers in angle brackets with the .h extension, e.g., <unistd.h>, <stdlib.h>, <Python.h>.
- C++ standard library headers (without file extension), e.g., <algorithm>, <cstddef>.
- Other libraries' .h files.
- Your project's .h files.
- Include headers in the following order: Related header, C system headers, C++ standard library headers, other libraries' headers, your project's headers.
- All of a project's header files should be listed as descendants of the project's source directory without use of UNIX directory aliases . (the current directory) or .. (the parent directory). For example, google-awesome-project/src/base/logging.h should be included as:
- #include "base/logging.h" Headers should only be included using an angle-bracketed path if the library requires you to do so. In particular, the following headers require angle brackets:
#### Namespaces

- Follow the rules on Namespace Names.
- Terminate multi-line namespaces with comments as shown in the given examples.
- To place generated protocol message code in a namespace, use the package specifier in the .proto file. See Protocol Buffer Packages for details.
- Do not declare anything in namespace std, including forward declarations of standard library classes. Declaring entities in namespace std is undefined behavior, i.e., not portable. To declare entities from the standard library, include the appropriate header file.
- You may not use a using-directive to make all names from a namespace available. // Forbidden -- This pollutes the namespace. using namespace foo;
- Do not use inline namespaces.
- Single-line nested namespace declarations are preferred in new code, but are not required. namespace my_project::my_component { ... } // namespace my_project::my_component
- With few exceptions, place code in a namespace. Namespaces should have unique names based on the project name, and possibly its path. Do not use using-directives (e.g., using namespace foo). Do not use inline namespaces. For unnamed namespaces, see Internal Linkage.
- Namespaces subdivide the global scope into distinct, named scopes, and so are useful for preventing name collisions in the global scope.
- Namespaces provide a method for preventing name conflicts in large programs while allowing most code to use reasonably short names.
#### Internal Linkage

- When definitions in a .cc file do not need to be referenced outside that file, give them internal linkage by placing them in an unnamed namespace or declaring them static. Do not use either of these constructs in .h files.
- All declarations can be given internal linkage by placing them in unnamed namespaces. Functions and variables can also be given internal linkage by declaring them static. This means that anything you're declaring can't be accessed from another file. If a different file declares something with the same name, then the two entities are completely independent.
- Use of internal linkage in .cc files is encouraged for all code that does not need to be referenced elsewhere. Do not use internal linkage in .h files.
- Format unnamed namespaces like named namespaces. In the terminating comment, leave the namespace name empty:
#### Nonmember, Static Member, and Global Functions

- Prefer placing nonmember functions in a namespace; use completely global functions rarely. Do not use a class simply to group static members. Static methods of a class should generally be closely related to instances of the class or the class's static data.
- Nonmember and static member functions can be useful in some situations. Putting nonmember functions in a namespace avoids polluting the global namespace.
- Nonmember and static member functions may make more sense as members of a new class, especially if they access external resources or have significant dependencies.
- Sometimes it is useful to define a function not bound to a class instance. Such a function can be either a static member or a nonmember function. Nonmember functions should not depend on external variables, and should nearly always exist in a namespace. Do not create classes only to group static members; this is no different than just giving the names a common prefix, and such grouping is usually unnecessary anyway.
- If you define a nonmember function and it is only needed in its .cc file, use internal linkage to limit its scope.
#### Local Variables

- Place a function's variables in the narrowest scope possible, and initialize variables in the declaration.
- C++ allows you to declare variables anywhere in a function. We encourage you to declare them in a scope as local as possible, and as close to the first use as possible. This makes it easier for the reader to find the declaration and see what type the variable is and what it was initialized to. In particular, initialization should be used instead of declaration and assignment, e.g.,:
- while (const char* p = strchr(str, '/')) str = p + 1; There is one caveat: if the variable is an object, its constructor is invoked every time it enters scope and is created, and its destructor is invoked every time it goes out of scope.
- // Inefficient implementation: for (int i = 0; i < 1000000; ++i) { Foo f; // My ctor and dtor get called 1000000 times each. f.DoSomething(i); } It may be more efficient to declare such a variable used in a loop outside that loop:
#### Static and Global Variables

- As a rule of thumb: a global variable satisfies these requirements if its declaration, considered in isolation, could be constexpr.
- Global and static variables are very useful for a large number of applications: named constants, auxiliary data structures internal to some translation unit, command-line flags, logging, registration mechanisms, background infrastructure, etc.
#### Decision on destruction

- When destructors are trivial, their execution is not subject to ordering at all (they are effectively not "run"); otherwise we are exposed to the risk of accessing objects after the end of their lifetime. Therefore, we only allow objects with static storage duration if they are trivially destructible. Fundamental types (like pointers and int) are trivially destructible, as are arrays of trivially destructible types. Note that variables marked with constexpr are trivially destructible.
#### Decision on initialization

- Initialization is a more complex topic. This is because we must not only consider whether class constructors execute, but we must also consider the evaluation of the initializer:
- int n = 5; // Fine int m = f(); // ? (Depends on f) Foo x; // ? (Depends on Foo::Foo) Bar y = g(); // ? (Depends on g and on Bar::Bar) All but the first statement expose us to indeterminate initialization ordering.
- The concept we are looking for is called constant initialization in the formal language of the C++ standard. It means that the initializing expression is a constant expression, and if the object is initialized by a constructor call, then the constructor must be specified as constexpr, too:
- By contrast, the following initializations are problematic:
- int p = getpid(); // Allowed, as long as no other static variable // uses p in its own initialization. Dynamic initialization of static local variables is allowed (and common).
#### Common patterns

- Global strings: if you require a named global or static string constant, consider using a constexpr variable of string_view, character array, or character pointer, pointing to a string literal. String literals have static storage duration already and are usually sufficient. See TotW #140.
- Smart pointers (std::unique_ptr, std::shared_ptr): smart pointers execute cleanup during destruction and are therefore forbidden. Consider whether your use case fits into one of the other patterns described in this section. One simple solution is to use a plain pointer to a dynamically allocated object and never delete it (see last item).
- Static variables of custom types: if you require static, constant data of a type that you need to define yourself, give the type a trivial destructor and a constexpr constructor.
- If all else fails, you can create an object dynamically and never delete it by using a function-local static pointer or reference (e.g., static const auto& impl = *new T(args...);).
#### thread_local Variables

- Thread-local data is inherently safe from races (because only one thread can ordinarily access it), which makes thread_local useful for concurrent programming.
- thread_local is the only standard-supported way of creating thread-local data.
- Accessing a thread_local variable may trigger execution of an unpredictable and uncontrollable amount of other code during thread-start or first use on a given thread.
- thread_local variables are effectively global variables, and have all the drawbacks of global variables other than lack of thread-safety.
- The memory consumed by a thread_local variable scales with the number of running threads (in the worst case), which can be quite large in a program.
- Data members cannot be thread_local unless they are also static.
- We may suffer from use-after-free bugs if thread_local variables have complex destructors. In particular, the destructor of any such variable must not call any code (transitively) that refers to any potentially-destroyed thread_local. This property is hard to enforce.
- Approaches for avoiding use-after-free in global/static contexts do not work for thread_locals. Specifically, skipping destructors for globals and static variables is allowable because their lifetimes end at program shutdown. Thus, any "leak" is managed immediately by the OS cleaning up our memory and other resources. By contrast, skipping destructors for thread_local variables leads to resource leaks proportional to the total number of threads that terminate during the lifetime of the program.
- thread_local variables that aren't declared inside a function must be initialized with a true compile-time constant, and this must be enforced by using the constinit attribute. Prefer thread_local over other ways of defining thread-local data.
- Variables can be declared with the thread_local specifier:
### Classes

- Classes are the fundamental unit of code in C++. Naturally, we use them extensively. This section lists the main dos and don'ts you should follow when writing a class.
#### Doing Work in Constructors

- No need to worry about whether the class has been initialized or not.
- Objects that are fully initialized by constructor call can be const and may also be easier to use with standard containers or algorithms.
- If the work calls virtual functions, these calls will not get dispatched to the subclass implementations. Future modification to your class can quietly introduce this problem even if your class is not currently subclassed, causing much confusion.
- There is no easy way for constructors to signal errors, short of crashing the program (not always appropriate) or using exceptions (which are forbidden).
- If the work fails, we now have an object whose initialization code failed, so it may be an unusual state requiring a bool IsValid() state checking mechanism (or similar) which is easy to forget to call.
- You cannot take the address of a constructor, so whatever work is done in the constructor cannot easily be handed off to, for example, another thread.
- Avoid virtual method calls in constructors, and avoid initialization that can fail if you can't signal an error.
- It is possible to perform arbitrary initialization in the body of the constructor.
- Constructors should never call virtual functions. If appropriate for your code , terminating the program may be an appropriate error handling response. Otherwise, consider a factory function or Init() method as described in TotW #42 . Avoid Init() methods on objects with no other states that affect which public methods may be called (semi-constructed objects of this form are particularly hard to work with correctly).
#### Implicit Conversions

- Implicit conversions can make a type more usable and expressive by eliminating the need to explicitly name a type when it's obvious.
- Implicit conversions can be a simpler alternative to overloading, such as when a single function with a string_view parameter takes the place of separate overloads for std::string and const char*.
- List initialization syntax is a concise and expressive way of initializing objects.
- Implicit conversions can hide type-mismatch bugs, where the destination type does not match the user's expectation, or the user is unaware that any conversion will take place.
- Implicit conversions can make code harder to read, particularly in the presence of overloading, by making it less obvious what code is actually getting called.
- Constructors that take a single argument may accidentally be usable as implicit type conversions, even if they are not intended to do so.
- When a single-argument constructor is not marked explicit, there's no reliable way to tell whether it's intended to define an implicit conversion, or the author simply forgot to mark it.
- Implicit conversions can lead to call-site ambiguities, especially when there are bidirectional implicit conversions. This can be caused either by having two types that both provide an implicit conversion, or by a single type that has both an implicit constructor and an implicit type conversion operator.
- List initialization can suffer from the same problems if the destination type is implicit, particularly if the list has only a single element.
- Do not define implicit conversions. Use the explicit keyword for conversion operators and single-argument constructors.
#### Copyable and Movable Types

- If the class has no private section, like a struct or an interface-only base class, then the copyability/movability can be determined by the copyability/movability of any public data members.
- If a base class clearly isn't copyable or movable, derived classes naturally won't be either. An interface-only base class that leaves these operations implicit is not sufficient to make concrete subclasses clear.
- Note that if you explicitly declare or delete either the constructor or assignment operation for copy, the other copy operation is not obvious and must be declared or deleted. Likewise for move operations.
- A class's public API must make clear whether the class is copyable, move-only, or neither copyable nor movable. Support copying and/or moving if these operations are clear and meaningful for your type.
- A movable type is one that can be initialized and assigned from temporaries.
- For user-defined types, the copy behavior is defined by the copy constructor and the copy-assignment operator. Move behavior is defined by the move constructor and the move-assignment operator, if they exist, or by the copy constructor and the copy-assignment operator otherwise.
- The copy/move constructors can be implicitly invoked by the compiler in some situations, e.g., when passing objects by value.
- Move operations allow the implicit and efficient transfer of resources out of rvalue objects. This allows a plainer coding style in some cases.
- Copy constructors are invoked implicitly, which makes the invocation easy to miss. This may cause confusion for programmers used to languages where pass-by-reference is conventional or mandatory. It may also encourage excessive copying, which can cause performance problems.
- Every class's public interface must make clear which copy and move operations the class supports. This should usually take the form of explicitly declaring and/or deleting the appropriate operations in the public section of the declaration.
#### Structs vs. Classes

- Use a struct only for passive objects that carry data; everything else is a class.
- The struct and class keywords behave almost identically in C++. We add our own semantic meanings to each keyword, so you should use the appropriate keyword for the data-type you're defining.
- If more functionality or invariants are required, or struct has wide visibility and expected to evolve, then a class is more appropriate. If in doubt, make it a class.
- For consistency with STL, you can use struct instead of class for stateless types, such as traits, template metafunctions, and some functors.
#### Structs vs. Pairs and Tuples

- Prefer to use a struct instead of a pair or a tuple whenever the elements can have meaningful names.
- While using pairs and tuples can avoid the need to define a custom type, potentially saving work when writing code, a meaningful field name will almost always be much clearer when reading code than .first, .second, or std::get<X>. While C++14's introduction of std::get<Type> to access a tuple element by type rather than index (when the type is unique) can sometimes partially mitigate this, a field name is usually substantially clearer and more informative than a type.
- Pairs and tuples may be appropriate in generic code where there are not specific meanings for the elements of the pair or tuple. Their use may also be required in order to interoperate with existing code or APIs.
#### Inheritance

- Composition is often more appropriate than inheritance. When using inheritance, make it public.
- When a sub-class inherits from a base class, it includes the definitions of all the data and operations that the base class defines. "Interface inheritance" is inheritance from a pure abstract base class (one with no state or defined methods); all other inheritance is "implementation inheritance".
- Implementation inheritance reduces code size by reusing the base class code as it specializes an existing type. Because inheritance is a compile-time declaration, you and the compiler can understand the operation and detect errors. Interface inheritance can be used to programmatically enforce that a class expose a particular API. Again, the compiler can detect errors, in this case, when a class does not define a necessary method of the API.
- For implementation inheritance, because the code implementing a sub-class is spread between the base and the sub-class, it can be more difficult to understand an implementation. The sub-class cannot override functions that are not virtual, so the sub-class cannot change implementation.
- Multiple inheritance is especially problematic, because it often imposes a higher performance overhead (in fact, the performance drop from single inheritance to multiple inheritance can often be greater than the performance drop from ordinary to virtual dispatch), and because it risks leading to "diamond" inheritance patterns, which are prone to ambiguity, confusion, and outright bugs.
- All inheritance should be public. If you want to do private inheritance, you should be including an instance of the base class as a member instead. You may use final on classes when you don't intend to support using them as base classes.
- Do not overuse implementation inheritance. Composition is often more appropriate. Try to restrict use of inheritance to the "is-a" case: Bar subclasses Foo if it can reasonably be said that Bar "is a kind of" Foo.
- Limit the use of protected to those member functions that might need to be accessed from subclasses. Note that data members should be private.
- Multiple inheritance is permitted, but multiple implementation inheritance is strongly discouraged.
#### Operator Overloading

- Providing a correct, consistent, and unsurprising set of operator overloads requires some care, and failure to do so can lead to confusion and bugs.
- Overuse of operators can lead to obfuscated code, particularly if the overloaded operator's semantics don't follow convention.
- The hazards of function overloading apply just as much to operator overloading, if not more so.
- Operator overloads can fool our intuition into thinking that expensive operations are cheap, built-in operations.
- Finding the call sites for overloaded operators may require a search tool that's aware of C++ syntax, rather than, e.g., grep.
- If you get the argument type of an overloaded operator wrong, you may get a different overload rather than a compiler error. For example, foo < bar may do one thing, while &foo < &bar does something totally different.
- Certain operator overloads are inherently hazardous. Overloading unary & can cause the same code to have different meanings depending on whether the overload declaration is visible. Overloads of &&, ||, and , (comma) cannot match the evaluation-order semantics of the built-in operators.
- Operators are often defined outside the class, so there's a risk of different files introducing different definitions of the same operator. If both definitions are linked into the same binary, this results in undefined behavior, which can manifest as subtle run-time bugs.
- User-defined literals (UDLs) allow the creation of new syntactic forms that are unfamiliar even to experienced C++ programmers, such as "Hello World"sv as a shorthand for std::string_view("Hello World"). Existing notations are clearer, though less terse.
- Because they can't be namespace-qualified, uses of UDLs also require use of either using-directives (which we ban) or using-declarations (which we ban in header files except when the imported names are part of the interface exposed by the header file in question). Given that header files would have to avoid UDL suffixes, we prefer to avoid having conventions for literals differ between header files and source files.
#### Access Control

- Make classes' data members private, unless they are constants. This simplifies reasoning about invariants, at the cost of some easy boilerplate in the form of accessors (usually const) if necessary.
- For technical reasons, we allow data members of a test fixture class defined in a .cc file to be protected when using Google Test. If a test fixture class is defined outside of the .cc file it is used in, for example in a .h file, make data members private.
#### Declaration Order

- Types and type aliases (typedef, using, enum, nested structs and classes, and friend types)
- (Optionally, for structs only) non-static data members
- Constructors and assignment operators
- All other functions (static and non-static member functions, and friend functions)
- All other data members (static and non-static)
- Group similar declarations together, placing public parts earlier.
- A class definition should usually start with a public: section, followed by protected:, then private:. Omit sections that would be empty.
- Within each section, prefer grouping similar kinds of declarations together, and prefer the following order:
- Do not put large method definitions inline in the class definition. Usually, only trivial or performance-critical, and very short, methods may be defined inline. See Defining Functions in Header Files for more details.
#### Inputs and Outputs

- The output of a C++ function is naturally provided via a return value and sometimes via output parameters (or in/out parameters).
- Prefer using return values over output parameters: they improve readability, and often provide the same or better performance. See TotW #176.
- Prefer to return by value or, failing that, return by reference. Avoid returning a raw pointer unless it can be null.
- Avoid defining functions that require a reference parameter to outlive the call. In some cases reference parameters can bind to temporaries, leading to lifetime bugs. Instead, find a way to eliminate the lifetime requirement (for example, by copying the parameter), or pass retained parameters by pointer and document the lifetime and non-null requirements. See TotW 116 for more.
- When ordering function parameters, put all input-only parameters before any output parameters. In particular, do not add new parameters to the end of the function just because they are new; place new input-only parameters before the output parameters. This is not a hard-and-fast rule. Parameters that are both input and output muddy the waters, and, as always, consistency with related functions may require you to bend the rule. Variadic functions may also require unusual parameter ordering.
#### Write Short Functions

- Prefer small and focused functions.
- We recognize that long functions are sometimes appropriate, so no hard limit is placed on functions length. If a function exceeds about 40 lines, think about whether it can be broken up without harming the structure of the program.
- Even if your long function works perfectly now, someone modifying it in a few months may add new behavior. This could result in bugs that are hard to find. Keeping your functions short and simple makes it easier for other people to read and modify your code. Small functions are also easier to test.
- You could find long and complicated functions when working with some code. Do not be intimidated by modifying existing code: if working with such a function proves to be difficult, you find that errors are hard to debug, or you want to use a piece of it in several different contexts, consider breaking up the function into smaller and more manageable pieces.
#### Function Overloading

- Use overloaded functions (including constructors) only if a reader looking at a call site can get a good idea of what is happening without having to first figure out exactly which overload is being called.
- You may write a function that takes a const std::string& and overload it with another that takes const char*. However, in this case consider std::string_view instead.
- class MyClass { public: void Analyze(const std::string& text); void Analyze(const char* text, size_t textlen); };
- Overloading can make code more intuitive by allowing an identically-named function to take different arguments. It may be necessary for templatized code, and it can be convenient for Visitors.
- Overloading based on const or ref qualification may make utility code more usable, more efficient, or both. See TotW #148 for more.
- If a function is overloaded by the argument types alone, a reader may have to understand C++'s complex matching rules in order to tell what's going on. Also many people are confused by the semantics of inheritance if a derived class overrides only some of the variants of a function.
- You may overload a function when there are no semantic differences between variants. These overloads may vary in types, qualifiers, or argument count. However, a reader of such a call must not need to know which member of the overload set is chosen, only that something from the set is being called.
- To reflect this unified design, prefer a single, comprehensive "umbrella" comment that documents the entire overload set and is placed before the first declaration.
- Where a reader might have difficulty connecting the umbrella comment to a specific overload, it's okay to have a comment for specific overloads.
#### Default Arguments

- Default arguments are allowed on non-virtual functions when the default is guaranteed to always have the same value. Follow the same restrictions as for function overloading, and prefer overloaded functions if the readability gained with default arguments doesn't outweigh the downsides below.
- Often you have a function that uses default values, but occasionally you want to override the defaults. Default parameters allow an easy way to do this without having to define many functions for the rare exceptions. Compared to overloading the function, default arguments have a cleaner syntax, with less boilerplate and a clearer distinction between 'required' and 'optional' arguments.
- Defaulted arguments are another way to achieve the semantics of overloaded functions, so all the reasons not to overload functions apply.
- The defaults for arguments in a virtual function call are determined by the static type of the target object, and there's no guarantee that all overrides of a given function declare the same defaults.
- Default parameters are re-evaluated at each call site, which can bloat the generated code. Readers may also expect the default's value to be fixed at the declaration instead of varying at each call.
- Function pointers are confusing in the presence of default arguments, since the function signature often doesn't match the call signature. Adding function overloads avoids these problems.
- Default arguments are banned on virtual functions, where they don't work properly, and in cases where the specified default might not evaluate to the same value depending on when it was evaluated. (For example, don't write void f(int n = counter++);.)
- In some other cases, default arguments can improve the readability of their function declarations enough to overcome the downsides above, so they are allowed. When in doubt, use overloads.
#### Trailing Return Type Syntax

- Use trailing return types only where using the ordinary syntax (leading return types) is impractical or much less readable.
- C++ allows two different forms of function declarations. In the older form, the return type appears before the function name. For example:
- int Foo(int x); The newer form uses the auto keyword before the function name and a trailing return type after the argument list. For example, the declaration above could equivalently be written:
- auto Foo(int x) -> int; The trailing return type is in the function's scope. This doesn't make a difference for a simple case like int but it matters for more complicated cases, like types declared in class scope or types written in terms of the function parameters.
- Trailing return types are the only way to explicitly specify the return type of a lambda expression. In some cases the compiler is able to deduce a lambda's return type, but not in all cases. Even when the compiler can deduce it automatically, sometimes specifying it explicitly would be clearer for readers.
- Sometimes it's easier and more readable to specify a return type after the function's parameter list has already appeared. This is particularly true when the return type depends on template parameters. For example:
- template <typename T, typename U> auto Add(T t, U u) -> decltype(t + u); versus template <typename T, typename U> decltype(declval<T&>() + declval<U&>()) Add(T t, U u);
- Trailing return type syntax has no analogue in C++-like languages such as C and Java, so some readers may find it unfamiliar.
- Existing codebases have an enormous number of function declarations that aren't going to get changed to use the new syntax, so the realistic choices are using the old syntax only or using a mixture of the two. Using a single version is better for uniformity of style.
- In most cases, continue to use the older style of function declaration where the return type goes before the function name. Use the new trailing-return-type form only in cases where it's required (such as lambdas) or where, by putting the type after the function's parameter list, it allows you to write the type in a much more readable way. The latter case should be rare; it's mostly an issue in fairly complicated template code, which is discouraged in most cases.
### Google-Specific Magic

- There are various tricks and utilities that we use to make C++ code more robust, and various ways we use C++ that may differ from what you see elsewhere.
#### cpplint

- Use cpplint.py to detect style errors.
- cpplint.py is a tool that reads a source file and identifies many style errors. It is not perfect, and has both false positives and false negatives, but it is still a valuable tool.
- Some projects have instructions on how to run cpplint.py from their project tools. If the project you are contributing to does not, you can download cpplint.py separately.
