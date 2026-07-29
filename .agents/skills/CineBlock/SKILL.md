```markdown
# CineBlock Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions found in the CineBlock repository, a Python-based project with no detected framework. You'll learn about file naming, import/export styles, commit practices, and how to structure and run tests. This guide is ideal for contributors looking to maintain consistency and quality in CineBlock's codebase.

## Coding Conventions

### File Naming
- **Style:** PascalCase  
  Example:  
  ```python
  # Good
  MovieManager.py

  # Bad
  movie_manager.py
  ```

### Import Style
- **Relative imports are preferred.**  
  Example:  
  ```python
  from .MovieManager import MovieManager
  ```

### Export Style
- **Named Exports:**  
  Explicitly export classes, functions, or variables by name.  
  Example:  
  ```python
  class MovieManager:
      pass

  __all__ = ['MovieManager']
  ```

### Commit Patterns
- **Type:** Freeform (no enforced prefixes)
- **Average Length:** ~53 characters  
  Example:  
  ```
  Add user authentication to MovieManager
  ```

## Workflows

### Adding a New Feature
**Trigger:** When you want to introduce new functionality  
**Command:** `/add-feature`

1. Create a new PascalCase Python file for your feature.
2. Use relative imports to integrate with existing modules.
3. Export your main classes/functions using named exports (`__all__`).
4. Write or update corresponding test files (`*.test.*`).
5. Commit your changes with a clear, concise message.

### Running Tests
**Trigger:** To verify code correctness after changes  
**Command:** `/run-tests`

1. Identify test files (pattern: `*.test.*`).
2. Use the project's preferred test runner (framework not specified; check project docs or use `pytest` as default).
3. Run all test files and review results.
4. Fix any failing tests before merging.

### Refactoring Code
**Trigger:** To improve code structure or readability  
**Command:** `/refactor-code`

1. Rename files using PascalCase if needed.
2. Update imports to maintain relative style.
3. Ensure named exports are preserved.
4. Run tests to confirm nothing is broken.
5. Commit with a descriptive message about the refactor.

## Testing Patterns

- **Framework:** Not specified (use `pytest` or similar if unsure)
- **Test File Pattern:** Files should be named using the pattern `*.test.*` (e.g., `MovieManager.test.py`).
- **Placement:** Place test files alongside or near the modules they test.
- **Example Test File:**
  ```python
  # MovieManager.test.py

  from .MovieManager import MovieManager

  def test_movie_addition():
      manager = MovieManager()
      assert manager.add_movie("Inception") is True
  ```

## Commands
| Command        | Purpose                                         |
|----------------|-------------------------------------------------|
| /add-feature   | Start the workflow for adding a new feature     |
| /run-tests     | Run all test files in the repository            |
| /refactor-code | Begin a code refactor while following conventions|
```
