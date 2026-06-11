import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { processDueReminders } from "@/lib/reminders";

export const maxDuration = 60;

// vercel.json runs this once daily (Vercel Hobby plan only allows
// once-per-day cron schedules). For more frequent checks (e.g. the
// original 3x/day cadence), add an external scheduler such as
// cron-job.org that calls this endpoint with
// `Authorization: Bearer $CRON_SECRET` on the desired schedule —
// processDueReminders() is idempotent and safe to call more often.

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const processed = await processDueReminders(supabase);

  return NextResponse.json({ processed });
}
