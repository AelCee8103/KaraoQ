import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { updateRoomStatus } from "@/server/core/rooms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let status: "open" | "locked" = "locked";
    try {
      const body = await req.json();
      if (body.status === "open" || body.status === "locked") {
        status = body.status;
      }
    } catch {
      // default lock
    }

    const ctx = await createNextServerContext(req);
    const result = await updateRoomStatus(ctx, id, status);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
