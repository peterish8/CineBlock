import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://1.1.1.1/cdn-cgi/trace");
    const text = await res.text();
    const match = text.match(/^loc=(.+)$/m);
    const code = match?.[1]?.trim().toUpperCase();
    if (code && code.length === 2) {
      return NextResponse.json({ country: code });
    }
  } catch { /* fall through */ }

  return NextResponse.json({ country: "US" });
}
