import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

// The Password provider lets anyone create an account with any email and no
// verification — fine for local/dev testing, not safe to expose on the production
// Convex deployment. Set CONVEX_ENVIRONMENT=production on that deployment
// (npx convex env set CONVEX_ENVIRONMENT production --prod) to disable it there;
// it stays enabled wherever the variable is unset (local dev, preview).
const isProductionDeployment = process.env.CONVEX_ENVIRONMENT === "production";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(isProductionDeployment ? [] : [Password()]),
  ],
});
