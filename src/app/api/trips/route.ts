import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { subDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase";

interface CreateTripBody {
  destination: string;
  departure_date: string;
  return_date: string;
  trip_type: string;
  activities: string[];
  phone_number: string;
  travel_style: string;
  reminders: {
    threeDaysBefore: boolean;
    oneDayBefore: boolean;
    morningOf: boolean;
  };
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateTripBody;
  const {
    destination,
    departure_date,
    return_date,
    trip_type,
    activities,
    phone_number,
    travel_style,
    reminders,
  } = body;

  if (!destination || !departure_date || !return_date) {
    return NextResponse.json(
      { error: "Destination and dates are required." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  // Profiles has a foreign key relationship with trips, so make sure a
  // profile row exists for this user before inserting the trip.
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    phone_number: phone_number || null,
    travel_style: travel_style || null,
  });

  console.log("[api/trips] profile upsert error:", profileError);

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: userId,
      destination,
      departure_date,
      return_date,
      trip_type,
      activities,
      status: "planning",
    })
    .select("id")
    .single();

  console.log("[api/trips] trip insert data:", trip);
  console.log("[api/trips] trip insert error:", tripError);

  if (tripError || !trip) {
    return NextResponse.json(
      { error: tripError?.message ?? "Failed to create trip." },
      { status: 500 }
    );
  }

  const departure = new Date(departure_date);
  const reminderRows = [
    reminders?.threeDaysBefore && {
      trip_id: trip.id,
      user_id: userId,
      remind_at: subDays(departure, 3).toISOString(),
      message: `Your trip to ${destination} is in 3 days — time to start packing!`,
    },
    reminders?.oneDayBefore && {
      trip_id: trip.id,
      user_id: userId,
      remind_at: subDays(departure, 1).toISOString(),
      message: `Your trip to ${destination} is tomorrow — finish packing!`,
    },
    reminders?.morningOf && {
      trip_id: trip.id,
      user_id: userId,
      remind_at: departure.toISOString(),
      message: `Today's the day! Double-check your packing list for ${destination}.`,
    },
  ].filter(Boolean);

  if (reminderRows.length > 0) {
    const { error: reminderError } = await supabase
      .from("reminders")
      .insert(reminderRows);

    console.log("[api/trips] reminders insert error:", reminderError);
  }

  return NextResponse.json({ id: trip.id }, { status: 201 });
}
