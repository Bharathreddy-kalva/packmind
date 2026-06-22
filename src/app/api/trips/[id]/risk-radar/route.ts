import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTripAccess } from "@/lib/trip-access";
import { refreshTripRiskRadar } from "@/lib/risk-radar";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const accessRole = await getTripAccess(supabase, id, userId);

  if (!accessRole) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  try {
    const result = await refreshTripRiskRadar(supabase, id);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[risk-radar] Manual refresh failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to refresh Trip Risk Radar.",
      },
      { status: 500 }
    );
  }
}
