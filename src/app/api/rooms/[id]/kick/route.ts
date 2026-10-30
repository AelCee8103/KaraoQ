import { NextRequest } from "next/server";
import { createNextServerContext, jsonResponse, errorResponse } from "@/server/adapters/next/context";
import { kickMember } from "@/server/core/rooms";
import { kickMemberSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = kickMemberSchema.parse(body);

    const ctx = await createNextServerContext(req);
    const result = await kickMember(ctx, id, validated.userId);

    return jsonResponse({ success: result });
  } catch (err) {
    return errorResponse(err);
  }
}
