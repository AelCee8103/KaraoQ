import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { deleteUserData } from "@/server/core/library";

export async function POST(req: NextRequest) {
  try {
    const ctx = await createNextServerContext(req);
    const result = await deleteUserData(ctx);
    return jsonResponse({ success: result });
  } catch (err) {
    return errorResponse(err);
  }
}
