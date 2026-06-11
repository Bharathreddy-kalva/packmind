import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { processDueReminders } from "@/lib/reminders";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production." },
      { status: 403 }
    );
  }

  const supabase = createSupabaseServerClient();
  const processed = await processDueReminders(supabase);

  return NextResponse.json({ processed });
}
