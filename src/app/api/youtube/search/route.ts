import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { searchKaraokeVideos } from "@/server/core/youtube";
import { youtubeSearchSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const pageToken = searchParams.get("pageToken");

    const validated = youtubeSearchSchema.parse({ q, pageToken });
    const ctx = await createNextServerContext(req);
    const result = await searchKaraokeVideos(ctx, validated.q, validated.pageToken);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
