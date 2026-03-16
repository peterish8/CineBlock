---
name: Convex Integration
description: Standards and patterns for writing and interacting with Convex backend functions (queries, mutations, actions, crons) within a Next.js frontend.
---

# Purpose
To ensure robust, type-safe, and real-time backend functionality using Convex. This skill covers how to structure the `convex/` directory, write schema-validated functions, and call them correctly from React.

# When to Use
- Designing new database tables.
- Adding CRUD operations for the application.
- Implementing background tasks or crons.
- Fetching third-party APIs from the backend.

# Setup
Ensure `npx convex dev` is running in an adjacent terminal to automatically generate TypeScript types (`convex/_generated/api.ts`) whenever a backend file is modified.

# Core Concepts
- **Queries:** Read-only functions. Completely deterministic. They automatically subscribe the frontend to database changes for real-time updates.
- **Mutations:** Write operations. They update the state of the database.
- **Actions:** Functions that can have side effects (e.g., fetch requests to Stripe, RSS feeds, sending emails). They *cannot* query the DB directly; they must call internal queries/mutations to interact with the database.
- **Internal Functions:** Queries/mutations marked as `internalQuery` or `internalMutation` cannot be called by the frontend, only by other Convex functions (like Actions or Crons).

# Best Practices
- **Schema Validation:** Always define your tables in `convex/schema.ts` using `v.object({...})`. This enforces data integrity and gives the frontend accurate TypeScript hints.
- **Idempotency in Actions:** When fetching external data (like RSS feeds) in an Action and storing it via a Mutation, ensure the mutation checks for duplicates (e.g., checking if an article title or URL already exists) before inserting.
- **Auth Handling:** Use `ctx.auth.getUserIdentity()` to guard mutations and queries that belong to a specific user.

# Code Examples
## A standard Query and Mutation
```typescript
// convex/tasks.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", { text: args.text, isCompleted: false });
  },
});
```

## Consuming in React
```tsx
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function TaskList() {
  const tasks = useQuery(api.tasks.get);
  const addTask = useMutation(api.tasks.add);

  if (tasks === undefined) return <div>Loading...</div>;

  return (
    <div>
      {tasks.map(t => <div key={t._id}>{t.text}</div>)}
      <button onClick={() => addTask({ text: "New Task" })}>Add</button>
    </div>
  );
}
```

# Common Pitfalls
- **Using Node APIs in Queries/Mutations:** Convex runs in a V8 isolate. You cannot use native Node modules (like `fs` or `net`) or arbitrary npm packages that rely on them inside standard queries/mutations. Use Actions (`use node;`) if you need Node APIs.
- **Fetch in Queries:** You cannot use `fetch()` inside a `query`. You must use an `action`.
- **Forgetting `npm/npx convex dev`:** If you add a file to `convex/` and the frontend throws a "module not found" error for `_generated/api`, it's because the dev server isn't running to build the types.

# Security Notes
- Protect user data by enforcing `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw new Error("Unauthenticated");` at the top of protected handlers.

# Testing Strategy
- Rely on the strongly typed arguments (`args: { ... }`). Convex validates these automatically before the handler executes.
