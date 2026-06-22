import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

interface TripInvite {
  id: string;
  trip_id: string;
  invited_by_user_id: string;
  role: string;
  expires_at: string;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data: invite } = await supabase
    .from("trip_invites")
    .select("id, trip_id, invited_by_user_id, role, expires_at")
    .eq("token", token)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  const tripInvite = invite as TripInvite;
  if (new Date(tripInvite.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This invite has expired." },
      { status: 410 }
    );
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id, user_id")
    .eq("id", tripInvite.trip_id)
    .single();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  await supabase.from("profiles").upsert({ id: userId });

  if (trip.user_id !== userId) {
    const { error: collaboratorError } = await supabase
      .from("trip_collaborators")
      .upsert(
        {
          trip_id: tripInvite.trip_id,
          user_id: userId,
          role: tripInvite.role || "companion",
          invited_by_user_id: tripInvite.invited_by_user_id,
        },
        { onConflict: "trip_id,user_id" }
      );

    if (collaboratorError) {
      return NextResponse.json(
        { error: collaboratorError.message },
        { status: 500 }
      );
    }
  }

  await supabase
    .from("trip_invites")
    .update({
      accepted_by_user_id: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", tripInvite.id);

  return NextResponse.json({ tripId: tripInvite.trip_id });
}
