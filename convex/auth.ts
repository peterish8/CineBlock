import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

// Password sign-up has no email verification, so it exists only for the local test account.
// A deployment opts in with ENABLE_PASSWORD_AUTH=true (scripts/sync-convex-env.mjs sets it on dev).
const passwordAuthEnabled = process.env.ENABLE_PASSWORD_AUTH === "true";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(passwordAuthEnabled ? [Password()] : []),
  ],
});
