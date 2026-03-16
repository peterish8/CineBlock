---
name: Ecosystem Monitor
description: Meta-skill used to periodically check official docs and changelogs for core project dependencies, detect breaking changes, and propose skill updates.
---

# Purpose
To ensure the agent and project stay up to date with the fast-evolving front-end ecosystem (Next.js, Next.js App Router, Convex, Tailwind CSS). It acts as a preventative measure to flag deprecated patterns before they cause errors and provides migration steps when major version upgrades occur.

# When to Use
- When initiating a major version upgrade for a core framework (e.g., Next.js, React).
- When resolving persistent module resolution or typing IDE errors that could be caused by outdated API usage.
- Periodic health checks of the project's dependency surface.
- When you see a library deprecation warning in the build logs.

# Setup
No specific installation is required for this meta-skill. It dictates how the agent should proactively conduct web searches and verification.

# Core Concepts
- **Proactive Search:** The agent searches `changelog <Dependency Name> <Version>` to review breaking changes.
- **Migration Documentation:** Looking specifically for official migration guides (e.g., `Next.js 14 to 15 migration guide`).
- **Skill Generation:** If new patterns are standardized, the agent auto-generates or updates specific `.agents/skills/` files to match the new reality.

# Best Practices (latest standards)
- **Always Verify First:** Before rewriting code to accommodate an error, verify the framework's official documentation. Contextual gaps could cause hallucinated fixes.
- **Pinpoint the Break:** Only update the specific lines or hooks mentioned in the changelog.
- **Update Skills Concurrently:** Whenever a deprecation is addressed, create or update the corresponding agent skill file to cement the knowledge.

# Code Examples
## Ideal Process for Ecosystem Monitor
When checking for Next.js updates:
1. Agent uses `search_web` for "Next.js latest release notes".
2. Identifies a change (e.g., Server Actions behavior modification).
3. Modifies the codebase to match.
4. Generates a new `.agents/skills/nextjs-server-actions/skill.md` with the newly learned pattern.

# Common Pitfalls
- Applying older StackOverflow fixes instead of reading latest official docs.
- Ignoring TypeScript compiler warnings across the project when bumping versions.
- Upgrading a dependency without checking peer dependency compatibility (e.g., React version matching).

# Performance Notes
- Large upgrades should be done in isolated PRs or task boundaries to avoid cascading breakdowns of unrelated components.

# Security Notes
- Security patches for `@auth/core` or `convex` should be monitored heavily as they often include breaking changes designed to plug vulnerabilities.

# Testing Strategy
- Run `npm run build` after upgrading.
- Ensure typechecking passes across all Next.js server components and API routes.

# Upgrade / Versioning Notes
This skill dictates that during major version bumps, the agent MUST explicitly ask the user to regenerate or update all existing agent skills.

# Related Skills
- `nextjs-conventions`
- `convex-best-practices`
