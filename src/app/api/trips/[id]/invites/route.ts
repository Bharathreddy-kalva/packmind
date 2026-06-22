import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

const INVITE_TTL_DAYS = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!trip) {
    return NextResponse.json(
      { error: "Only the trip owner can create invites." },
      { status: 403 }
    );
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const { data: invite, error } = await supabase
    .from("trip_invites")
    .insert({
      trip_id: id,
      invited_by_user_id: userId,
      token,
      role: "companion",
      expires_at: expiresAt.toISOString(),
    })
    .select("token, expires_at")
    .single();

  if (error || !invite) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create invite." },
      { status: 500 }
    );
  }

  const inviteUrl = new URL(`/share/${invite.token}`, request.url).toString();

  return NextResponse.json({
    inviteUrl,
    expiresAt: invite.expires_at,
  });
}
