import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { syncUserProfile } from "@/server/core/auth";
import { z } from "zod";

const syncSchema = z.object({
  username: z.string().min(1),
  avatarUrl: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = syncSchema.parse(body);
    const ctx = await createNextServerContext(req);

    const profile = await syncUserProfile(ctx, validated);
    return jsonResponse(profile);
  } catch (err) {
    return errorResponse(err);
  }
}
