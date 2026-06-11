import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { differenceInCalendarDays } from "date-fns";
import Groq from "groq-sdk";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Trip, TripIntelligence } from "@/types";

export const maxDuration = 60;

const VALID_CATEGORIES = [
  "clothing",
  "toiletries",
  "electronics",
  "documents",
  "health",
  "misc",
];

interface IntelligenceRequestBody {
  feedback?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let feedback = "";
  try {
    const body = (await request.json()) as IntelligenceRequestBody;
    feedback = body?.feedback?.trim() ?? "";
  } catch {
    // No JSON body provided — generate from scratch.
  }

  const supabase = createSupabaseServerClient();

  const { data: tripData, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (tripError || !tripData) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  const trip = tripData as Trip;
  const { destination, departure_date: departureDate, return_date: returnDate, trip_type: tripType } = trip;

  const days =
    differenceInCalendarDays(new Date(returnDate), new Date(departureDate)) +
    1;

  const prompt = `
You are a travel intelligence expert. Research and analyze this trip:
Destination: ${destination}
Trip Type: ${tripType}
Dates: ${departureDate} to ${returnDate}
Duration: ${days} days

Provide a comprehensive travel intelligence report in this EXACT JSON format:
{
  "resourceWarnings": [
    {
      "type": "gas",
      "severity": "high",
      "title": "Limited Gas Stations",
      "description": "Nearest gas station is 45 miles from campsite",
      "action": "Fill up tank before entering the park"
    },
    {
      "type": "food",
      "severity": "medium",
      "title": "Limited Food Options",
      "description": "Only one small store, closes at 6pm",
      "action": "Stock up on supplies before arrival"
    },
    {
      "type": "medical",
      "severity": "high",
      "title": "Nearest Hospital",
      "description": "60 miles away in nearest city",
      "action": "Carry comprehensive first aid kit"
    },
    {
      "type": "connectivity",
      "severity": "medium",
      "title": "No Cell Service",
      "description": "Most of the area has no signal",
      "action": "Download offline maps, inform someone of your itinerary"
    },
    {
      "type": "water",
      "severity": "low",
      "title": "Water Sources",
      "description": "Natural water requires purification",
      "action": "Bring water filter or purification tablets"
    }
  ],
  "nearbyResources": {
    "gasStations": [
      {
        "name": "Chevron - Mineral",
        "distance": "17.9 miles from park entrance",
        "address": "31268 Hwy CA-44",
        "notes": "First gas station en route from Redding"
      },
      {
        "name": "Old Station Fill-Up",
        "distance": "24.9 miles",
        "address": "13413 State Hwy 44",
        "notes": "Convenience store attached"
      },
      {
        "name": "Beacon Gas Station",
        "distance": "20.1 miles",
        "address": "7640 Highway 147",
        "notes": "Highest rated - 4.3 stars"
      }
    ],
    "restaurants": [
      {
        "name": "Lassen Mineral Lodge Restaurant",
        "distance": "At park entrance",
        "cuisine": "American",
        "hours": "7am - 8pm",
        "notes": "Only restaurant inside park"
      }
    ],
    "groceryStores": [
      {
        "name": "Chester Grocery",
        "distance": "30 miles",
        "hours": "8am - 6pm",
        "notes": "Stock up before entering park"
      }
    ],
    "hospitals": [
      {
        "name": "St. Elizabeth Community Hospital",
        "distance": "45 miles - Red Bluff, CA",
        "phone": "530-529-8000",
        "emergency": true
      }
    ],
    "attractions": [
      {
        "name": "Bumpass Hell",
        "type": "Hydrothermal area",
        "duration": "3 hours",
        "difficulty": "Moderate",
        "notes": "Most popular trail, 3 miles round trip"
      },
      {
        "name": "Manzanita Lake",
        "type": "Lake/Fishing",
        "duration": "2 hours",
        "difficulty": "Easy",
        "notes": "Great for fishing and kayaking"
      }
    ]
  },
  "dayByDayPlan": [
    {
      "day": 1,
      "date": "2026-06-12",
      "theme": "Arrival & Setup",
      "weather": "Sunny 24°C",
      "schedule": [
        {
          "time": "08:00 AM",
          "activity": "Depart from home",
          "duration": "30 mins",
          "notes": "Fill gas tank before leaving city",
          "type": "travel"
        },
        {
          "time": "09:30 AM",
          "activity": "Stop at Chevron - Mineral (last gas)",
          "duration": "15 mins",
          "notes": "17.9 miles from park - fill up here",
          "type": "essential"
        },
        {
          "time": "11:00 AM",
          "activity": "Arrive at destination",
          "duration": "2 hours",
          "notes": "Check in at visitor center, get park map",
          "type": "arrival"
        },
        {
          "time": "02:00 PM",
          "activity": "Manzanita Lake walk",
          "duration": "2 hours",
          "notes": "Easy 1.8 mile loop, great introduction",
          "type": "activity"
        },
        {
          "time": "06:00 PM",
          "activity": "Dinner at Lassen Mineral Lodge",
          "duration": "1 hour",
          "notes": "Only restaurant - closes 8pm, arrive early",
          "type": "food"
        },
        {
          "time": "07:30 PM",
          "activity": "Camp setup & stargazing",
          "duration": "Evening",
          "notes": "No light pollution - amazing stars",
          "type": "leisure"
        }
      ],
      "warnings": ["Last grocery store 30 miles back", "Bear boxes required tonight"],
      "essentialItems": ["Tent", "Sleeping bag", "Camp stove", "Bear canister"]
    }
  ],
  "emergencyInfo": {
    "nearestHospital": "Name and distance",
    "emergencyNumber": "Local emergency number",
    "rangerStation": "If applicable",
    "evacuationRoutes": "Brief description"
  },
  "mustKnow": [
    "Park fills by 8am in summer - arrive early",
    "Bear boxes required at all campsites",
    "Permits required for Half Dome - book 6 months ahead"
  ],
  "autoAddItems": [
    {"name": "Offline maps downloaded", "category": "electronics", "reason": "No cell service"},
    {"name": "Water purification tablets", "category": "health", "reason": "Natural water sources"},
    {"name": "Extra cash $200", "category": "documents", "reason": "No ATMs in area"},
    {"name": "Portable charger 20000mAh", "category": "electronics", "reason": "No power hookups"}
  ]
}

Be specific and realistic for ${destination}. Research actual
facilities, distances, and conditions for this location.
Generate a realistic day by day plan with a "schedule" array for all ${days} days in "dayByDayPlan" — one entry per day, day numbers from 1 to ${days}, with dates starting at ${departureDate}.${
    feedback
      ? `\n\nThe traveler has requested the following changes to the itinerary: "${feedback}". Revise "dayByDayPlan" to incorporate this feedback while keeping the rest of the report accurate.`
      : ""
  }
Return ONLY valid JSON.`;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let responseText: string;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a travel intelligence expert. Return ONLY valid JSON with no markdown, no backticks, no explanation.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 8000,
      temperature: 0.6,
    });

    responseText = completion.choices[0]?.message?.content || "";
    if (!responseText) {
      return NextResponse.json(
        { error: "AI response did not contain text." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[intelligence] Groq API error:", err);
    const message =
      err instanceof Groq.APIError
        ? err.message
        : "Failed to generate trip intelligence.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let intelligence: TripIntelligence;
  try {
    const jsonText = responseText
      .trim()
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonText) as Partial<TripIntelligence>;

    intelligence = {
      resourceWarnings: parsed.resourceWarnings ?? [],
      nearbyResources: parsed.nearbyResources ?? {
        gasStations: [],
        restaurants: [],
        groceryStores: [],
        hospitals: [],
        attractions: [],
      },
      dayByDayPlan: parsed.dayByDayPlan ?? [],
      emergencyInfo: parsed.emergencyInfo ?? {
        nearestHospital: "",
        emergencyNumber: "",
        rangerStation: "",
        evacuationRoutes: "",
      },
      mustKnow: parsed.mustKnow ?? [],
      autoAddItems: parsed.autoAddItems ?? [],
    };
  } catch (err) {
    console.error("[intelligence] Failed to parse AI response:", err, responseText);
    return NextResponse.json(
      { error: "Failed to parse AI response." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("trips")
    .update({ trip_intelligence: intelligence })
    .eq("id", id);

  if (updateError) {
    console.error("[intelligence] trip update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  let addedItems: unknown[] = [];
  if (!feedback) {
    const autoAddRows = (intelligence.autoAddItems ?? [])
      .filter((item) => VALID_CATEGORIES.includes(item.category))
      .map((item) => ({
        trip_id: id,
        user_id: userId,
        name: `${item.name} [${item.reason}]`,
        category: item.category,
        is_packed: false,
        is_used: false,
        ai_suggested: true,
      }));

    if (autoAddRows.length > 0) {
      const { data: insertedItems, error: insertError } = await supabase
        .from("packing_items")
        .insert(autoAddRows)
        .select();

      if (insertError) {
        console.error("[intelligence] packing_items insert error:", insertError);
      } else {
        addedItems = insertedItems ?? [];
      }
    }
  }

  return NextResponse.json({
    success: true,
    intelligence,
    addedItems,
  });
}
