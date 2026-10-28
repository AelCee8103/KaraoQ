import type { Room, RoomMember, RoomSettings } from "../../lib/types/database.ts";
import { CoreError, type ServerContext } from "./types.ts";

// CSPRNG room key generator (no ambiguous characters: 0, O, 1, I)
const KEY_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomKey(): string {
  let bytes: Uint8Array;
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    bytes = new Uint8Array(6);
    globalThis.crypto.getRandomValues(bytes);
  } else {
    bytes = new Uint8Array(6);
    for (let i = 0; i < 6; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let key = "";
  for (let i = 0; i < 6; i++) {
    key += KEY_CHARSET[bytes[i] % KEY_CHARSET.length];
  }
  return key;
}

export function getRoomMemberRole(roomHostId: string, userId: string): "host" | "guest" {
  return roomHostId === userId ? "host" : "guest";
}

export async function createRoom(
  ctx: ServerContext,
  input: { name: string; maxGuests?: number; settings?: RoomSettings }
): Promise<{ room: Room; member: RoomMember }> {
  if (!ctx.user) {
    throw new CoreError("Authentication required to create a room", "UNAUTHORIZED", 401);
  }

  const roomKey = generateRoomKey();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(); // 12 hours

  const defaultSettings: RoomSettings = {
    maxSongsPerGuest: 3,
    allowGuestReorder: true,
    blockExplicit: false,
    fairPlayOrdering: false,
    ...input.settings,
  };

  const { data: roomData, error: roomError } = await ctx.supabase
    .from("rooms")
    .insert({
      host_id: ctx.user.id,
      name: input.name.trim(),
      room_key: roomKey,
      status: "open",
      max_guests: input.maxGuests || 12,
      settings: defaultSettings,
      last_activity_at: new Date().toISOString(),
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (roomError || !roomData) {
    throw new CoreError(
      `Failed to create room: ${roomError?.message || "Database insert failed"}`,
      "ROOM_CREATE_FAILED",
      500
    );
  }

  // Add Host as member
  const { data: memberData, error: memberError } = await ctx.supabase
    .from("room_members")
    .insert({
      room_id: roomData.id,
      user_id: ctx.user.id,
      nickname: ctx.user.username,
      role: "host",
      status: "active",
    })
    .select()
    .single();

  if (memberError || !memberData) {
    throw new CoreError("Failed to register room host", "HOST_MEMBER_FAILED", 500);
  }

  return {
    room: roomData as Room,
    member: memberData as RoomMember,
  };
}

export async function joinRoom(
  ctx: ServerContext,
  input: { roomKey: string; nickname: string }
): Promise<{ room: Room; member: RoomMember }> {
  if (!ctx.user) {
    throw new CoreError("Authentication required to join a room", "UNAUTHORIZED", 401);
  }

  const cleanKey = input.roomKey.trim().toUpperCase();

  // Find room
  const { data: roomData, error: roomError } = await ctx.supabase
    .from("rooms")
    .select("*")
    .eq("room_key", cleanKey)
    .single();

  if (roomError || !roomData) {
    throw new CoreError("Room not found. Please check your room key.", "ROOM_NOT_FOUND", 404);
  }

  const room = roomData as Room;

  if (room.status === "ended") {
    throw new CoreError("This room session has ended", "ROOM_ENDED", 400);
  }

  if (room.status === "locked" && room.host_id !== ctx.user.id) {
    throw new CoreError("This room is currently locked by the host", "ROOM_LOCKED", 403);
  }

  // Check if user was previously kicked
  const { data: existingMember } = await ctx.supabase
    .from("room_members")
    .select("*")
    .eq("room_id", room.id)
    .eq("user_id", ctx.user.id)
    .single();

  if (existingMember && existingMember.status === "kicked") {
    throw new CoreError("You have been kicked from this room and cannot rejoin", "USER_KICKED", 403);
  }

  // Check capacity if new member
  if (!existingMember || existingMember.status === "left") {
    const { count } = await ctx.supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("status", "active");

    if (count && count >= (room.max_guests || 12)) {
      throw new CoreError("This room is full (max guests reached)", "ROOM_FULL", 400);
    }
  }

  const role = getRoomMemberRole(room.host_id, ctx.user.id);
  const nickname = input.nickname.trim() || ctx.user.username;

  const { data: memberData, error: memberError } = await ctx.supabase
    .from("room_members")
    .upsert(
      {
        room_id: room.id,
        user_id: ctx.user.id,
        nickname,
        role,
        status: "active",
        joined_at: new Date().toISOString(),
      },
      { onConflict: "room_id,user_id" }
    )
    .select()
    .single();

  if (memberError || !memberData) {
    throw new CoreError("Failed to join room", "JOIN_FAILED", 500);
  }

  // Update room last activity
  await ctx.supabase
    .from("rooms")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", room.id);

  return {
    room,
    member: memberData as RoomMember,
  };
}

export async function getRoomDetails(
  ctx: ServerContext,
  roomId: string
): Promise<{ room: Room; members: RoomMember[] }> {
  const { data: roomData, error: roomError } = await ctx.supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !roomData) {
    throw new CoreError("Room not found", "ROOM_NOT_FOUND", 404);
  }

  const { data: membersData } = await ctx.supabase
    .from("room_members")
    .select("*, profile:profiles(*)")
    .eq("room_id", roomId)
    .eq("status", "active");

  return {
    room: roomData as Room,
    members: (membersData || []) as RoomMember[],
  };
}

export async function leaveRoom(ctx: ServerContext, roomId: string): Promise<boolean> {
  if (!ctx.user) throw new CoreError("Unauthorized", "UNAUTHORIZED", 401);

  await ctx.supabase
    .from("room_members")
    .update({ status: "left" })
    .eq("room_id", roomId)
    .eq("user_id", ctx.user.id);

  return true;
}

export async function kickMember(
  ctx: ServerContext,
  roomId: string,
  targetUserId: string
): Promise<boolean> {
  if (!ctx.user) throw new CoreError("Unauthorized", "UNAUTHORIZED", 401);

  // Authorize host
  const { data: room } = await ctx.supabase.from("rooms").select("host_id").eq("id", roomId).single();
  if (!room || room.host_id !== ctx.user.id) {
    throw new CoreError("Only the room host can kick members", "FORBIDDEN", 403);
  }

  if (targetUserId === ctx.user.id) {
    throw new CoreError("Host cannot kick themselves", "BAD_REQUEST", 400);
  }

  await ctx.supabase
    .from("room_members")
    .update({ status: "kicked" })
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  return true;
}

export async function updateRoomStatus(
  ctx: ServerContext,
  roomId: string,
  status: "open" | "locked" | "ended"
): Promise<Room> {
  if (!ctx.user) throw new CoreError("Unauthorized", "UNAUTHORIZED", 401);

  // Authorize host
  const { data: room } = await ctx.supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room || room.host_id !== ctx.user.id) {
    throw new CoreError("Only the room host can modify room status", "FORBIDDEN", 403);
  }

  const { data: updated, error } = await ctx.supabase
    .from("rooms")
    .update({
      status,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .select()
    .single();

  if (error || !updated) {
    throw new CoreError("Failed to update room status", "UPDATE_FAILED", 500);
  }

  return updated as Room;
}
