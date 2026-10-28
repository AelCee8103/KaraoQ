import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { getUserPlaylists, createPlaylist } from "@/server/core/library";
import { createPlaylistSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const ctx = await createNextServerContext(req);
    const result = await getUserPlaylists(ctx);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createPlaylistSchema.parse(body);
    const ctx = await createNextServerContext(req);

    const result = await createPlaylist(ctx, validated);
    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
