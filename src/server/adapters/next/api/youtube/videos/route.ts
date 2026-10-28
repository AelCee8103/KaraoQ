import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { getVideoDetails } from "@/server/core/youtube";
import { youtubeVideosSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids") || "";

    const validated = youtubeVideosSchema.parse({ ids });
    const videoIds = validated.ids.split(",").map((s) => s.trim()).filter(Boolean);

    const ctx = await createNextServerContext(req);
    const result = await getVideoDetails(ctx, videoIds);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
