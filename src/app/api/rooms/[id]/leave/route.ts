import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { leaveRoom } from "@/server/core/rooms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await createNextServerContext(req);
    const result = await leaveRoom(ctx, id);

    return jsonResponse({ success: result });
  } catch (err) {
    return errorResponse(err);
  }
}
