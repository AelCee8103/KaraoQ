import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { addPlaylistItem } from "@/server/core/library";
import { addPlaylistItemSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = addPlaylistItemSchema.parse(body);

    const ctx = await createNextServerContext(req);
    const result = await addPlaylistItem(ctx, id, validated);

    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
