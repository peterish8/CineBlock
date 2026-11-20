import { NextRequest, NextResponse } from "next/server";
import { protectedResourceResponse } from "@/lib/mcpProtectedResourceMetadata";

export const runtime = "nodejs";

type ResourceRouteContext = {
  params: Promise<{ resourcePath: string[] }>;
};

export async function GET(request: NextRequest, context: ResourceRouteContext) {
  const { resourcePath } = await context.params;
  if (resourcePath.join("/") !== "api/mcp") {
    return NextResponse.json({ error: "Protected resource metadata was not found." }, { status: 404 });
  }
  return protectedResourceResponse(request);
}
