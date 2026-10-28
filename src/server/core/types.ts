import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../../lib/types/database.ts";

export interface ServerContext {
  supabase: SupabaseClient;
  youtubeApiKey?: string;
  user?: Profile;
  token?: string;
  clientIp?: string;
}

export class CoreError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = "INTERNAL_SERVER_ERROR", statusCode = 500) {
    super(message);
    this.name = "CoreError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
