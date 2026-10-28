import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { getRoomQueue, addQueueItem } from "@/server/core/queue";
import { addQueueItemSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await createNextServerContext(req);
    const result = await getRoomQueue(ctx, id);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = addQueueItemSchema.parse(body);

    const ctx = await createNextServerContext(req);
    const result = await addQueueItem(ctx, id, validated);

    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
