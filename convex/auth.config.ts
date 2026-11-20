const authConfig = {
  providers: [
    {
      // The Convex site URL acts as the JWT issuer for the built-in Password provider.
      // Convex provides CONVEX_SITE_URL automatically on every deployment.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
