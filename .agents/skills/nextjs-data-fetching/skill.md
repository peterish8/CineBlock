---
name: NextJS App Router Data Fetching
description: Best practices and standard patterns for fetching data in Next.js 14 App Router, including Server Components, Client Components, and Server Actions.
---

# Purpose
To provide the standard, type-safe, and performant methods for fetching data and mutating state within the Next.js App Router paradigm, avoiding legacy `pages/` directory patterns like `getServerSideProps`.

# When to Use
- When creating a new route that requires backend data.
- When adding a mutation (form submission, button click) that updates the database.
- When passing data from Server Components to Client Components.

# Setup
Native to Next.js 14. Relies on React Server Components (RSC) by default.

# Core Concepts
- **React Server Components (RSCs):** The default in `app/`. They render exclusively on the server, can be `async`, and use direct database or API calls without exposing secrets to the client. Keep them focused on data fetching.
- **Client Components:** Indicated by `"use client"` at the top of the file. Used for interactivity, hooks (`useState`, `useEffect`), and browser APIs.
- **Server Actions:** Asynchronous functions defined on the server (`"use server"`) that can be called directly from Client Components (e.g., in a `<form action={...}>` or an `onClick` handler).

# Best Practices
- **Default to Server Components:** Always start building components as Server Components. Only add `"use client"` when interactivity is strictly necessary.
- **Push `"use client"` down the tree:** Keep Client Components as small leaves in your component tree. Pass fetched data down as props.
- **Use Server Actions for Mutations:** Replace traditional API routes (`/pages/api/*`) with Server Actions for form handling and data mutations where possible, as they provide better type safety and simpler code.
- **Caching:** Next.js aggressively caches fetch requests. Use `next: { revalidate: 60 }` for time-based caching, or `next: { tags: ['collection'] }` for on-demand revalidation.

# Code Examples
## Server Component Fetching
```tsx
// app/page.tsx (Server Component)
import { Suspense } from 'react';

async function getMovies() {
  const res = await fetch('https://api.tmdb.org/3/trending/movie/day', {
    headers: { Authorization: `Bearer ${process.env.TMDB_KEY}` }
  });
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

export default async function Page() {
  const data = await getMovies();
  
  return (
    <main>
      <h1>Trending Movies</h1>
      {/* Pass data to a Client Component if it needs interactivity */}
      <MovieGrid initialData={data.results} />
    </main>
  );
}
```

## Server Action Mutation
```tsx
// app/actions.ts
'use server'
import { revalidatePath } from 'next/cache';

export async function addFavorite(movieId: string) {
  // DB logic here
  await db.insert(...);
  revalidatePath('/favorites');
}
```

# Common Pitfalls
- **Importing Server Actions into Client Components incorrectly:** A Server Action file must have `"use server"` at the very top.
- **Passing complex objects to Client Components:** You cannot pass functions or non-serializable objects (like class instances) as props from a Server Component to a Client Component. Only pass plain JSON data.
- **Overusing `"use client"`:** Putting `"use client"` at the top of a layout or page file forces the entire route to be rendered on the client, negating the benefits of the App Router.

# Performance Notes
- Leverage `<Suspense>` boundaries to stream UI parts independently. Wrap slow data-fetching components in Suspense so the rest of the page loads instantly.

# Testing Strategy
- Use Jest and React Testing Library for Client Components.
- For Server Components and Server Actions, focus on integration testing and ensuring database interactions work correctly.
