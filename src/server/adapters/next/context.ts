import { NextRequest } from "next/server";
import { ServerContext } from "@/server/core/types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyPuterToken } from "@/server/core/auth";

export async function createNextServerContext(req: NextRequest): Promise<ServerContext> {
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch {
    // If Supabase not yet configured, build mock client to keep Next.js routes operable
    supabaseAdmin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
            in: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: "mock-id" }, error: null }),
          }),
        }),
        upsert: () => ({
          select: () => ({
            single: async () => ({ data: { id: "mock-id" }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: {}, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    } as any;
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || undefined;

  let user;
  if (token) {
    try {
      user = await verifyPuterToken(token, supabaseAdmin);
    } catch {
      // Ignore token verification errors for public endpoints
    }
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  return {
    supabase: supabaseAdmin,
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    user,
    token,
    clientIp,
  };
}

export function jsonResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(err: unknown) {
  const message = (err as Error)?.message || "Internal server error";
  const code = (err as { code?: string })?.code || "INTERNAL_ERROR";
  const statusCode = (err as { statusCode?: number })?.statusCode || 500;

  return Response.json(
    {
      success: false,
      error: { code, message },
    },
    { status: statusCode }
  );
}
