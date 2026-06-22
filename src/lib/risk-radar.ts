import Groq from "groq-sdk";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWeatherForecast } from "@/lib/weather";
import type {
  PackingImpact,
  Trip,
  TripRiskAlert,
  TripRiskRadar,
  WeatherDataPoint,
} from "@/types";

type SupabaseClient = ReturnType<typeof createSupabaseServerClient>;

const VALID_CATEGORIES = [
  "clothing",
  "toiletries",
  "electronics",
  "documents",
  "health",
  "misc",
];

const MAX_RISK_SCANS_PER_CRON = 4;

function cleanJsonResponse(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
}

function compareWeather(
  previous: WeatherDataPoint | null,
  latest: WeatherDataPoint | null
) {
  if (!latest) {
    return {
      changed: false,
      summary: "Live weather is unavailable for this departure date.",
      previous,
      latest,
    };
  }

  if (!previous) {
    return {
      changed: true,
      summary: `${latest.description} is now expected on departure day.`,
      previous,
      latest,
    };
  }

  const rainDelta =
    latest.precipitation_chance - previous.precipitation_chance;
  const tempDelta = latest.temp_max - previous.temp_max;
  const conditionChanged =
    latest.condition.toLowerCase() !== previous.condition.toLowerCase();

  const changes = [];
  if (conditionChanged) {
    changes.push(`${previous.condition} changed to ${latest.condition}`);
  }
  if (Math.abs(rainDelta) >= 20) {
    changes.push(
      `${Math.abs(rainDelta)}% ${rainDelta > 0 ? "more" : "less"} rain risk`
    );
  }
  if (Math.abs(tempDelta) >= 5) {
    changes.push(
      `${Math.abs(Math.round(tempDelta))}°C ${
        tempDelta > 0 ? "warmer" : "cooler"
      } than before`
    );
  }

  return {
    changed: changes.length > 0,
    summary:
      changes.length > 0
        ? changes.join(", ")
        : "No meaningful weather change since the last scan.",
    previous,
    latest,
  };
}

function normalizeSeverity(value: unknown): "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low"
    ? value
    : "low";
}

function normalizeRiskLevel(value: unknown): "high" | "medium" | "low" {
  return normalizeSeverity(value);
}

function normalizeAlerts(value: unknown): TripRiskAlert[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((alert) => ({
      type: String(alert?.type ?? "packing"),
      severity: normalizeSeverity(alert?.severity),
      title: String(alert?.title ?? "Travel watch item"),
      description: String(alert?.description ?? ""),
      impact: String(alert?.impact ?? ""),
      action: String(alert?.action ?? ""),
    }))
    .filter((alert) => alert.title.trim().length > 0)
    .slice(0, 6);
}

function normalizePackingImpacts(value: unknown): PackingImpact[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((impact) => ({
      itemName: String(impact?.itemName ?? ""),
      category: String(impact?.category ?? "misc").toLowerCase(),
      reason: String(impact?.reason ?? ""),
      bag: String(impact?.bag ?? "either") as PackingImpact["bag"],
    }))
    .filter(
      (impact) =>
        impact.itemName.trim().length > 0 &&
        VALID_CATEGORIES.includes(impact.category)
    )
    .slice(0, 8);
}

async function generateAiRiskRadar({
  trip,
  previousWeather,
  latestWeather,
  weatherChange,
}: {
  trip: Trip;
  previousWeather: WeatherDataPoint | null;
  latestWeather: WeatherDataPoint | null;
  weatherChange: ReturnType<typeof compareWeather>;
}): Promise<TripRiskRadar> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `You are PackMind's proactive travel risk radar.

Analyze this upcoming trip and return JSON only:
Destination: ${trip.destination}
Trip type: ${trip.trip_type}
Dates: ${trip.departure_date} to ${trip.return_date}
Activities: ${trip.activities.join(", ")}
Previous departure weather: ${previousWeather ? JSON.stringify(previousWeather) : "none"}
Latest departure weather: ${latestWeather ? JSON.stringify(latestWeather) : "unavailable"}
Weather change summary: ${weatherChange.summary}

Detect practical risks across:
- weather changes and packing impacts
- transit strikes or airport disruption patterns
- visa/passport/document issues travelers should confirm
- health alerts and medication/vaccine preparation
- attraction/park/road closures and schedule impacts

Use cautious language for items that require official confirmation. Return this exact shape:
{
  "riskLevel": "high",
  "headline": "Rain added on departure day",
  "summary": "A short co-pilot style summary of what changed and what PackMind did.",
  "nextScanReason": "What PackMind will watch in the next automatic scan.",
  "alerts": [
    {
      "type": "weather",
      "severity": "medium",
      "title": "Rain risk increased",
      "description": "Rain chance increased to 70% on departure day.",
      "impact": "Outdoor plans and electronics need extra protection.",
      "action": "Pack waterproof layer and keep chargers in a pouch."
    }
  ],
  "packingImpacts": [
    {
      "itemName": "Waterproof pouch",
      "category": "electronics",
      "reason": "Rain risk increased for departure day",
      "bag": "carry-on"
    }
  ]
}

Keep it specific to the trip. Return ONLY valid JSON with no markdown.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "Return only valid JSON. Be proactive, concise, and practical.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1800,
    temperature: 0.45,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(cleanJsonResponse(text)) as Partial<TripRiskRadar>;

  return {
    riskLevel: normalizeRiskLevel(parsed.riskLevel),
    headline: parsed.headline || "Trip radar scan complete",
    summary:
      parsed.summary ||
      "PackMind checked weather, travel logistics, documents, health, and packing impacts.",
    lastScannedAt: new Date().toISOString(),
    nextScanReason:
      parsed.nextScanReason ||
      "PackMind will keep watching for weather and travel-condition changes.",
    weatherChange,
    alerts: normalizeAlerts(parsed.alerts),
    packingImpacts: normalizePackingImpacts(parsed.packingImpacts),
  };
}

function fallbackRiskRadar({
  trip,
  weatherChange,
}: {
  trip: Trip;
  weatherChange: ReturnType<typeof compareWeather>;
}): TripRiskRadar {
  const alerts: TripRiskAlert[] = [];
  const packingImpacts: PackingImpact[] = [];
  const latest = weatherChange.latest;

  if (latest && latest.precipitation_chance >= 50) {
    alerts.push({
      type: "weather",
      severity: latest.precipitation_chance >= 75 ? "high" : "medium",
      title: "Rain risk on departure day",
      description: `${latest.precipitation_chance}% chance of rain is currently expected.`,
      impact: "Outdoor plans, documents, and electronics may need protection.",
      action: "Keep waterproof items and document protection near the top of your bag.",
    });
    packingImpacts.push(
      {
        itemName: "Compact umbrella",
        category: "misc",
        reason: "Rain risk detected for departure day",
        bag: "carry-on",
      },
      {
        itemName: "Waterproof pouch",
        category: "electronics",
        reason: "Protect chargers and devices from rain",
        bag: "carry-on",
      }
    );
  }

  if (trip.trip_type === "international") {
    alerts.push({
      type: "visa",
      severity: "medium",
      title: "Document check recommended",
      description: "International trips can require passport validity windows, visas, or transit documents.",
      impact: "Missing paperwork can block boarding.",
      action: "Confirm passport validity, visa rules, and transit requirements with official sources.",
    });
  }

  return {
    riskLevel:
      alerts.some((alert) => alert.severity === "high")
        ? "high"
        : alerts.length > 0
          ? "medium"
          : "low",
    headline:
      alerts.length > 0
        ? alerts[0].title
        : "No major changes detected",
    summary:
      alerts.length > 0
        ? `${alerts[0].title}. PackMind added practical packing suggestions where useful.`
        : "PackMind checked weather and packing impact signals. Nothing urgent changed.",
    lastScannedAt: new Date().toISOString(),
    nextScanReason:
      "PackMind will keep watching weather changes and trip-prep risks until departure.",
    weatherChange,
    alerts,
    packingImpacts,
  };
}

async function addPackingImpacts(
  supabase: SupabaseClient,
  trip: Trip,
  impacts: PackingImpact[]
) {
  if (impacts.length === 0) return [];

  const { data: existingItems } = await supabase
    .from("packing_items")
    .select("name, category")
    .eq("trip_id", trip.id);

  const existingKeys = new Set(
    (existingItems ?? []).map((item) =>
      `${String(item.category).toLowerCase()}:${String(item.name)
        .toLowerCase()
        .replace(/\s*\[[^\]]+\]$/, "")
        .replace(/\s*\(x\d+\)$/, "")
        .trim()}`
    )
  );

  const rows = impacts
    .filter((impact) => VALID_CATEGORIES.includes(impact.category))
    .filter((impact) => {
      const key = `${impact.category}:${impact.itemName.toLowerCase().trim()}`;
      return !existingKeys.has(key);
    })
    .map((impact) => ({
      trip_id: trip.id,
      user_id: trip.user_id,
      name: `${impact.itemName} [Risk Radar: ${impact.reason}]`,
      category: impact.category,
      is_packed: false,
      is_used: false,
      ai_suggested: true,
    }));

  if (rows.length === 0) return [];

  const { data, error } = await supabase.from("packing_items").insert(rows).select();
  if (error) {
    console.error("[risk-radar] Failed to add packing impacts:", error);
    return [];
  }

  return data ?? [];
}

export async function refreshTripRiskRadar(
  supabase: SupabaseClient,
  tripId: string
) {
  const { data: tripData, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (error || !tripData) {
    throw new Error(error?.message ?? "Trip not found.");
  }

  const trip = tripData as Trip;
  const previousWeather = trip.weather_data?.[0] ?? null;
  const latestWeather = await getWeatherForecast(
    trip.destination,
    trip.departure_date
  ).catch(() => null);
  const weatherChange = compareWeather(previousWeather, latestWeather);

  let riskRadar: TripRiskRadar;
  try {
    riskRadar = await generateAiRiskRadar({
      trip,
      previousWeather,
      latestWeather,
      weatherChange,
    });
  } catch (err) {
    console.error("[risk-radar] AI radar failed, using fallback:", err);
    riskRadar = fallbackRiskRadar({ trip, weatherChange });
  }

  const addedItems = await addPackingImpacts(
    supabase,
    trip,
    riskRadar.packingImpacts
  );

  const update: Record<string, unknown> = {
    risk_radar: riskRadar,
    risk_radar_refreshed_at: riskRadar.lastScannedAt,
  };

  if (latestWeather) {
    update.weather_data = [latestWeather];
  }

  const { error: updateError } = await supabase
    .from("trips")
    .update(update)
    .eq("id", trip.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { riskRadar, addedItems };
}

export async function processDailyRiskRadarRefresh(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const staleBefore = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

  const { data: trips, error } = await supabase
    .from("trips")
    .select("id, destination")
    .gte("departure_date", today)
    .or(`risk_radar_refreshed_at.is.null,risk_radar_refreshed_at.lt.${staleBefore}`)
    .order("departure_date", { ascending: true })
    .limit(MAX_RISK_SCANS_PER_CRON);

  if (error) {
    console.error("[risk-radar] Failed to fetch trips:", error);
    return 0;
  }

  let processed = 0;
  for (const trip of trips ?? []) {
    try {
      await refreshTripRiskRadar(supabase, trip.id);
      processed += 1;
    } catch (err) {
      console.error(
        `[risk-radar] Failed to refresh ${trip.destination}:`,
        err
      );
    }
  }

  return processed;
}
