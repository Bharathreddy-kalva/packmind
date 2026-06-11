import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { differenceInCalendarDays, format } from "date-fns";
import Groq from "groq-sdk";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWeatherForecast } from "@/lib/weather";
import type { DestinationIntel, Trip, ItemHistory } from "@/types";

export const maxDuration = 60;

const VALID_CATEGORIES = [
  "clothing",
  "toiletries",
  "electronics",
  "documents",
  "health",
  "misc",
];

interface GeneratedItem {
  name: string;
  category: string;
  quantity: number;
}

async function getDestinationIntelligence(
  groq: Groq,
  destination: string,
  tripType: string,
  month: string
): Promise<DestinationIntel | null> {
  const prompt = `You are a travel expert. For a ${tripType} trip to ${destination} in ${month}, provide destination-specific packing intelligence in JSON:
{
  "climate": "hot and humid",
  "essentialItems": [
    {"name": "Temple sarong", "reason": "Required for temple entry", "category": "clothing"},
    {"name": "Mosquito repellent DEET", "reason": "High mosquito activity in this season", "category": "health"},
    {"name": "Type C adapter", "reason": "Indonesian power sockets are Type C", "category": "electronics"},
    {"name": "Water purification tablets", "reason": "Tap water unsafe for drinking", "category": "health"}
  ],
  "culturalNotes": ["Remove shoes before entering temples", "Dress modestly in religious sites"],
  "weatherWarnings": ["Rainy season - pack waterproof bag cover"],
  "localTips": ["Pharmacies are expensive - bring medications from home"]
}

Tailor every field specifically to ${destination} for ${month} — avoid generic advice. Categories must be: clothing, toiletries, electronics, documents, health, misc. Return ONLY valid JSON with no markdown, no backticks, no explanation.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a travel expert. Return ONLY valid JSON with no markdown, no backticks, no explanation.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content || "";
    const jsonText = text
      .trim()
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonText) as DestinationIntel;

    if (!Array.isArray(parsed.essentialItems)) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.error("[generate] Destination intelligence error:", err);
    return null;
  }
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

  let force = false;
  try {
    const body = await request.json();
    force = body?.force === true;
  } catch {
    // No JSON body provided — default to a non-forced generation.
  }

  try {
    return await generatePackingList(id, userId, force);
  } catch (error) {
    console.error("Generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generatePackingList(id: string, userId: string, force: boolean) {
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

  if (trip.status === "active" && !force) {
    const { data: items } = await supabase
      .from("packing_items")
      .select("*")
      .eq("trip_id", id)
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      items: items ?? [],
      alreadyGenerated: true,
    });
  }

  const { destination, departure_date, return_date, trip_type, activities } =
    trip;

  const { data: profile } = await supabase
    .from("profiles")
    .select("travel_style")
    .eq("id", userId)
    .single();

  const weather = await getWeatherForecast(destination, departure_date).catch(
    () => null
  );

  const { data: historyData } = await supabase
    .from("item_history")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_type", trip_type)
    .order("times_packed", { ascending: false })
    .limit(15);

  const itemHistory = (historyData ?? []) as ItemHistory[];

  const days =
    differenceInCalendarDays(new Date(return_date), new Date(departure_date)) +
    1;

  const weatherSummary = weather
    ? `${Math.round((weather.temp_min + weather.temp_max) / 2)}°C, ${weather.description}`
    : "Unavailable — use seasonal expectations for the destination";

  let userPrompt = `Generate a packing list for:
Destination: ${destination}
Trip type: ${trip_type}
Duration: ${days} days
Activities: ${activities.join(", ")}
Weather: ${weatherSummary}
Travel style: ${profile?.travel_style ?? "balanced"}

Return JSON in this exact format:
{
  "items": [
    {"name": "T-shirts", "category": "clothing", "quantity": 5},
    {"name": "Passport", "category": "documents", "quantity": 1}
  ]
}
Categories must be: clothing, toiletries, electronics, documents, health, misc`;

  if (itemHistory.length > 0) {
    const frequentlyPacked = itemHistory
      .filter((item) => item.times_packed > 0)
      .map((item) => item.item_name);
    const oftenForgotten = itemHistory
      .filter((item) => item.times_forgotten > 0)
      .map((item) => item.item_name);

    if (frequentlyPacked.length > 0 || oftenForgotten.length > 0) {
      userPrompt += "\n\nPersonalization based on this traveler's history:";
      if (frequentlyPacked.length > 0) {
        userPrompt += `\n- Items they usually pack for this trip type: ${frequentlyPacked.join(", ")}`;
      }
      if (oftenForgotten.length > 0) {
        userPrompt += `\n- Items they often forget (be sure to include these): ${oftenForgotten.join(", ")}`;
      }
    }
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const month = format(new Date(departure_date), "MMMM");

  let responseText: string;
  let destinationIntel: DestinationIntel | null;
  try {
    const [completion, intel] = await Promise.all([
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a travel packing assistant. Return ONLY valid JSON with no markdown, no backticks, no explanation.",
          },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
      getDestinationIntelligence(groq, destination, trip_type, month),
    ]);

    responseText = completion.choices[0].message.content || "";
    if (!responseText) {
      return NextResponse.json(
        { error: "AI response did not contain text." },
        { status: 500 }
      );
    }
    destinationIntel = intel;
  } catch (err) {
    console.error("[generate] Groq API error:", err);
    const message = err instanceof Groq.APIError ? err.message : "Failed to generate packing list.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let parsed: { items: GeneratedItem[] };
  try {
    const jsonText = responseText
      .trim()
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "");
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error("[generate] Failed to parse AI response:", err, responseText);
    return NextResponse.json(
      { error: "Failed to parse AI response." },
      { status: 500 }
    );
  }

  const itemRows = (parsed.items ?? [])
    .filter((item) => VALID_CATEGORIES.includes(item.category))
    .map((item) => ({
      trip_id: id,
      user_id: userId,
      name: item.quantity ? `${item.name} (x${item.quantity})` : item.name,
      category: item.category,
      is_packed: false,
      is_used: false,
      ai_suggested: true,
    }));

  const destinationLabel = destination.split(",")[0].trim();
  const existingNames = new Set(
    itemRows.map((item) =>
      item.name.toLowerCase().replace(/\s*\(x\d+\)$/, "").trim()
    )
  );

  const destinationItemRows = (destinationIntel?.essentialItems ?? [])
    .filter((item) => VALID_CATEGORIES.includes(item.category))
    .filter((item) => !existingNames.has(item.name.toLowerCase().trim()))
    .map((item) => ({
      trip_id: id,
      user_id: userId,
      name: `${item.name} [${destinationLabel}-specific]`,
      category: item.category,
      is_packed: false,
      is_used: false,
      ai_suggested: true,
    }));

  const { error: deleteError } = await supabase
    .from("packing_items")
    .delete()
    .eq("trip_id", id)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("[generate] packing_items delete error:", deleteError);
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  const allItemRows = [...itemRows, ...destinationItemRows];
  const uniqueItemRows = allItemRows.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (other) =>
          other.name.toLowerCase() === item.name.toLowerCase() &&
          other.category === item.category
      )
  );

  const { data: insertedItems, error: insertError } = await supabase
    .from("packing_items")
    .insert(uniqueItemRows)
    .select();

  if (insertError) {
    console.error("[generate] packing_items insert error:", insertError);
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("trips")
    .update({
      status: "active",
      weather_data: weather ? [weather] : null,
      destination_intel: destinationIntel,
    })
    .eq("id", id);

  if (updateError) {
    console.error("[generate] trip status update error:", updateError);
  }

  return NextResponse.json({ success: true, items: insertedItems });
}
