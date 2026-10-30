import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { getUserFavourites, toggleFavourite } from "@/server/core/library";
import { addFavouriteSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await createNextServerContext(req);
    const result = await getUserFavourites(ctx);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = addFavouriteSchema.parse(body);
    const ctx = await createNextServerContext(req);

    const result = await toggleFavourite(ctx, validated);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
