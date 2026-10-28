import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { getUserPlayHistory } from "@/server/core/library";

export async function GET(req: NextRequest) {
  try {
    const ctx = await createNextServerContext(req);
    const result = await getUserPlayHistory(ctx);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
