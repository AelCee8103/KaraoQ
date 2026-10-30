import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { createRoom } from "@/server/core/rooms";
import { createRoomSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createRoomSchema.parse(body);
    const ctx = await createNextServerContext(req);

    const result = await createRoom(ctx, validated);
    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
