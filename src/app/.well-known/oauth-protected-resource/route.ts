import { NextRequest } from "next/server";
import { protectedResourceResponse } from "@/lib/mcpProtectedResourceMetadata";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return protectedResourceResponse(request);
}
