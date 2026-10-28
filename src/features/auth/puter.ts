"use client";

export interface PuterUser {
  uuid?: string;
  username: string;
  email?: string;
  avatar?: string;
}

export interface PuterAuthInterface {
  signIn(): Promise<PuterUser | null>;
  signOut(): Promise<void>;
  isSignedIn(): boolean;
  getUser(): Promise<PuterUser | null>;
  getToken(): Promise<string | null>;
  kvGet<T = unknown>(key: string): Promise<T | null>;
  kvSet(key: string, value: unknown): Promise<boolean>;
  aiChat(prompt: string, model?: string): Promise<string | null>;
  isRunningInPuter(): boolean;
}

// Lazy loader for puter SDK if not attached to window
async function loadPuterSdk(): Promise<any> {
  if (typeof window === "undefined") return null;

  const win = window as any;
  if (win.puter) {
    return win.puter;
  }

  try {
    const puterModule = await import("@heyputer/puter.js");
    const puterInstance = puterModule.default || puterModule;
    if (puterInstance) {
      win.puter = puterInstance;
      return win.puter;
    }
  } catch (err) {
    console.warn("Failed to load @heyputer/puter.js directly, checking window.puter", err);
  }

  return win.puter || null;
}

export const puterClient: PuterAuthInterface = {
  async signIn() {
    const puter = await loadPuterSdk();
    if (!puter) {
      throw new Error("Puter.js SDK not available");
    }
    await puter.auth.signIn();
    return this.getUser();
  },

  async signOut() {
    const puter = await loadPuterSdk();
    if (!puter) return;
    try {
      await puter.auth.signOut();
    } catch (e) {
      console.warn("Error during puter signOut:", e);
    }
  },

  isSignedIn() {
    if (typeof window === "undefined") return false;
    const win = window as any;
    if (!win.puter) return false;
    try {
      return Boolean(win.puter.auth?.isSignedIn?.());
    } catch {
      return false;
    }
  },

  async getUser() {
    const puter = await loadPuterSdk();
    if (!puter || !puter.auth?.isSignedIn?.()) return null;
    try {
      const user = await puter.auth.getUser();
      return {
        uuid: user.uuid || user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      };
    } catch (err) {
      console.error("Failed to get Puter user:", err);
      return null;
    }
  },

  async getToken() {
    const puter = await loadPuterSdk();
    if (!puter || !puter.auth?.isSignedIn?.()) return null;
    const token = puter.authToken;
    return typeof token === "string" && token.trim() ? token : null;
  },

  async kvGet<T = unknown>(key: string): Promise<T | null> {
    const puter = await loadPuterSdk();
    if (!puter || !puter.kv) return null;
    try {
      const val = await puter.kv.get(key);
      if (val === undefined || val === null) return null;
      if (typeof val === "string") {
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      }
      return val as T;
    } catch (err) {
      console.warn(`Puter KV get failed for ${key}:`, err);
      return null;
    }
  },

  async kvSet(key: string, value: unknown): Promise<boolean> {
    const puter = await loadPuterSdk();
    if (!puter || !puter.kv) return false;
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      await puter.kv.set(key, serialized);
      return true;
    } catch (err) {
      console.warn(`Puter KV set failed for ${key}:`, err);
      return false;
    }
  },

  async aiChat(prompt: string, model = "gpt-4o-mini"): Promise<string | null> {
    const puter = await loadPuterSdk();
    if (!puter || !puter.ai) return null;
    try {
      const response = await puter.ai.chat(prompt, { model });
      if (typeof response === "string") return response;
      if (response && typeof response === "object" && "message" in response) {
        return (response.message as { content?: string })?.content || null;
      }
      return null;
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "";
      if (errorMsg.includes("insufficient_funds") || errorMsg.includes("funds")) {
        console.warn("Puter AI funds exhausted:", err);
        return "AI suggestions are currently resting (insufficient Puter allowance).";
      }
      console.warn("Puter AI chat error:", err);
      return null;
    }
  },

  isRunningInPuter(): boolean {
    if (typeof window === "undefined") return false;
    const win = window as any;
    return Boolean(win.puter?.env || win.location.hostname.endsWith(".puter.site"));
  },
};
