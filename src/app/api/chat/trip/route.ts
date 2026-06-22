import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import Groq from "groq-sdk";
import { createSupabaseServerClient } from "@/lib/supabase";
import { scheduleTripReminders, sendTripCreatedSms } from "@/lib/reminders";
import { getDestinationImage } from "@/lib/unsplash";

export const maxDuration = 60;

const VALID_TRIP_TYPES = [
  "beach",
  "business",
  "hiking",
  "city",
  "camping",
  "ski",
  "wedding",
  "backpacking",
];

const VALID_TRAVEL_STYLES = ["minimalist", "balanced", "prepared"];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TripReadyData {
  destination?: string;
  departure_date?: string;
  return_date?: string;
  trip_type?: string;
  activities?: string[];
  travel_style?: string;
  phone_number?: string;
}

const TRIP_READY_PATTERN = /<TRIP_READY>([\s\S]*?)<\/TRIP_READY>/;

const FALLBACK_MESSAGE =
  "Sorry, I had trouble pulling that together — could you tell me a bit more about your trip?";

function buildSystemPrompt() {
  const today = format(new Date(), "yyyy-MM-dd");

  return `You are PackMind's AI trip planner. Your job is to collect trip details through friendly conversation and then create a trip.

You need to collect:
- destination
- departure date
- return date
- trip type (one of: beach, business, hiking, city, camping, ski, wedding, backpacking)
- activities (a list of things they'll be doing)
- travel style (one of: minimalist, balanced, prepared)
- phone number for SMS reminders

Start by asking where they want to go. Ask one question at a time. Be friendly and conversational, and use travel-related language. Infer as many details as you can from what the user already told you (e.g. "Tokyo for 5 days in December for business" tells you the destination, trip length, month, and trip type), and only ask follow-up questions for whatever is still missing.

Today's date is ${today}. If the user gives a date without a year, assume the next upcoming occurrence of that date.

When you have ALL of the details, respond with something like "Perfect! I have everything I need. Creating your trip now..." and then immediately follow it with a JSON block in this EXACT format:

<TRIP_READY>
{
  "destination": "City, Country",
  "departure_date": "YYYY-MM-DD",
  "return_date": "YYYY-MM-DD",
  "trip_type": "beach",
  "activities": ["Activity 1", "Activity 2"],
  "travel_style": "balanced",
  "phone_number": "+1234567890"
}
</TRIP_READY>

Rules for the JSON block:
- Only include it once every field above has been collected.
- Use valid JSON with double-quoted keys and string values, no trailing commas.
- "trip_type" must be exactly one of: beach, business, hiking, city, camping, ski, wedding, backpacking.
- "travel_style" must be exactly one of: minimalist, balanced, prepared.
- Dates must be in YYYY-MM-DD format.
- Do not include the JSON block until you're ready — otherwise just keep the conversation going.`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = (await request.json()) as { messages?: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages is required." },
      { status: 400 }
    );
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let responseText: string;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    responseText = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[chat/trip] Groq API error:", err);
    const message =
      err instanceof Groq.APIError ? err.message : "Failed to reach the AI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!responseText) {
    return NextResponse.json(
      { error: "AI response did not contain text." },
      { status: 500 }
    );
  }

  const tripReadyMatch = responseText.match(TRIP_READY_PATTERN);

  if (!tripReadyMatch) {
    return NextResponse.json({
      message: responseText.trim(),
      tripCreated: false,
    });
  }

  const introText = responseText.slice(0, tripReadyMatch.index).trim();

  let tripData: TripReadyData;
  try {
    tripData = JSON.parse(tripReadyMatch[1].trim()) as TripReadyData;
  } catch (err) {
    console.error("[chat/trip] Failed to parse TRIP_READY JSON:", err);
    return NextResponse.json({
      message: introText || FALLBACK_MESSAGE,
      tripCreated: false,
    });
  }

  const {
    destination,
    departure_date,
    return_date,
    activities,
    phone_number,
  } = tripData;

  const tripType = VALID_TRIP_TYPES.includes(tripData.trip_type ?? "")
    ? (tripData.trip_type as string)
    : null;
  const travelStyle = VALID_TRAVEL_STYLES.includes(tripData.travel_style ?? "")
    ? (tripData.travel_style as string)
    : null;

  if (
    !isNonEmptyString(destination) ||
    !departure_date ||
    !DATE_PATTERN.test(departure_date) ||
    !return_date ||
    !DATE_PATTERN.test(return_date) ||
    return_date < departure_date ||
    !tripType ||
    !travelStyle
  ) {
    console.error("[chat/trip] Invalid TRIP_READY payload:", tripData);
    return NextResponse.json({
      message: introText || FALLBACK_MESSAGE,
      tripCreated: false,
    });
  }

  const supabase = createSupabaseServerClient();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    phone_number: phone_number || null,
    travel_style: travelStyle,
  });

  if (profileError) {
    console.error("[chat/trip] profile upsert error:", profileError);
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: userId,
      destination,
      departure_date,
      return_date,
      trip_type: tripType,
      activities: Array.isArray(activities) ? activities : [],
      status: "planning",
    })
    .select("id")
    .single();

  if (tripError || !trip) {
    console.error("[chat/trip] trip insert error:", tripError);
    return NextResponse.json(
      { error: tripError?.message ?? "Failed to create trip." },
      { status: 500 }
    );
  }

  await scheduleTripReminders(supabase, trip.id, userId, departure_date);

  try {
    await sendTripCreatedSms(
      supabase,
      userId,
      destination,
      departure_date,
      return_date
    );
  } catch (err) {
    console.error("[chat/trip] Failed to send trip-created SMS:", err);
  }

  try {
    const image = await getDestinationImage(destination);
    if (image) {
      await supabase
        .from("trips")
        .update({ image_url: image.url, image_credit: image.credit })
        .eq("id", trip.id);
    }
  } catch (err) {
    console.error("[chat/trip] Failed to fetch destination image:", err);
  }

  return NextResponse.json({
    message: introText || "Perfect! I have everything I need. Creating your trip now...",
    tripCreated: true,
    tripId: trip.id,
  });
}
