import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

client.mutation("testError:runSignInTest").then(res => {
  console.log("SUCCESS:", JSON.stringify(res, null, 2));
}).catch(e => {
  console.log("CAUGHT EXCEPTION!");
  console.log(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
});
