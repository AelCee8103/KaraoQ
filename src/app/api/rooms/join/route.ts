import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { joinRoom } from "@/server/core/rooms";
import { joinRoomSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = joinRoomSchema.parse(body);
    const ctx = await createNextServerContext(req);

    const result = await joinRoom(ctx, validated);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
