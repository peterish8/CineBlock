import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testSignIn() {
  try {
    console.log("Calling auth:signIn on", process.env.NEXT_PUBLIC_CONVEX_URL);
    await client.mutation("auth:signIn", { provider: "google" });
  } catch (err) {
    console.error("\n\n=== CAUGHT ERROR ===");
    console.error(err);
    console.error("Message:", err.message);
    console.error("Data:", err.data);
    console.error("====================\n\n");
  }
}

testSignIn();
