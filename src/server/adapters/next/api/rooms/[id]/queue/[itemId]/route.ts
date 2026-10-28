import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { updateQueueItem, deleteQueueItem } from "@/server/core/queue";
import { updateQueueItemSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const body = await req.json();
    const validated = updateQueueItemSchema.parse(body);

    const ctx = await createNextServerContext(req);
    const result = await updateQueueItem(ctx, id, itemId, validated);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const ctx = await createNextServerContext(req);
    const result = await deleteQueueItem(ctx, id, itemId);

    return jsonResponse({ success: result });
  } catch (err) {
    return errorResponse(err);
  }
}
