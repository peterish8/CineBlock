export default {
  providers: [
    {
      // The Convex site URL acts as the JWT issuer for the built-in Password provider.
      // Set CONVEX_SITE_URL in your Convex dashboard environment variables:
      //   npx convex env set CONVEX_SITE_URL https://gregarious-buffalo-687.eu-west-1.convex.site
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
