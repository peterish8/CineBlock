import { NextResponse, NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// cb_ prefix + 48 hex chars = 51 chars total
const TOKEN_REGEX = /^cb_[0-9a-f]{48}$/;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 401 });
  }
  const token = auth.slice(7).trim();
  if (!TOKEN_REGEX.test(token)) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
  }

  try {
    const result = await convex.mutation(api.users.validateCliSearch, { token });
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "Invalid token" ? 401 : 429 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("CLI auth error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
