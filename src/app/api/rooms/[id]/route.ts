import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { getRoomDetails } from "@/server/core/rooms";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await createNextServerContext(req);
    const result = await getRoomDetails(ctx, id);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
