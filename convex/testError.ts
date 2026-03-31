import { mutation } from "./_generated/server";
import { signIn } from "./auth"; // this is the signIn action

export const runSignInTest = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // call the internal signIn method of convexAuth, which throws the redirect Error.
      // Actually, we can't easily call it directly because it needs arguments.
      // Let's just return the process.env keys to see what's set!
      return {
        hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasId: !!process.env.GOOGLE_CLIENT_ID,
        siteUrl: process.env.CONVEX_SITE_URL,
        allKeys: Object.keys(process.env).filter(k => !k.startsWith("npm_")),
      };
    } catch (e: any) {
      return { error: e.message, stack: e.stack };
    }
  },
});
