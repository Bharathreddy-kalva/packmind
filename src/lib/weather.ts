import axios from "axios";
import type { WeatherDataPoint } from "@/types";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

interface GeocodingResult {
  lat: number;
  lon: number;
}

interface ForecastListItem {
  dt_txt: string;
  main: {
    temp: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
  pop: number;
}

interface ForecastResponse {
  list: ForecastListItem[];
}

/**
 * Fetches the weather forecast for a destination on a given date (YYYY-MM-DD).
 * Returns null if the destination can't be geocoded or the date is outside
 * the 5-day forecast window provided by OpenWeatherMap's free tier.
 */
export async function getWeatherForecast(
  destination: string,
  date: string
): Promise<WeatherDataPoint | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set");
  }

  const geoResponse = await axios.get<GeocodingResult[]>(GEO_URL, {
    params: { q: destination, limit: 1, appid: apiKey },
  });

  const location = geoResponse.data[0];
  if (!location) {
    return null;
  }

  const forecastResponse = await axios.get<ForecastResponse>(FORECAST_URL, {
    params: {
      lat: location.lat,
      lon: location.lon,
      units: "metric",
      appid: apiKey,
    },
  });

  const entries = forecastResponse.data.list.filter((entry) =>
    entry.dt_txt.startsWith(date)
  );

  if (entries.length === 0) {
    return null;
  }

  const middayEntry =
    entries.find((entry) => entry.dt_txt.endsWith("12:00:00")) ?? entries[0];

  return {
    date,
    temp_min: Math.min(...entries.map((entry) => entry.main.temp)),
    temp_max: Math.max(...entries.map((entry) => entry.main.temp)),
    condition: middayEntry.weather[0]?.main ?? "Unknown",
    description: middayEntry.weather[0]?.description ?? "",
    icon: middayEntry.weather[0]?.icon ?? "",
    precipitation_chance: Math.round(
      Math.max(...entries.map((entry) => entry.pop ?? 0)) * 100
    ),
  };
}
