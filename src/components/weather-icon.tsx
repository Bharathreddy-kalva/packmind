import { Cloud, CloudRain, Snowflake, Sun, Wind } from "lucide-react";

export function WeatherIcon({
  condition,
  className,
}: {
  condition: string;
  className?: string;
}) {
  switch (condition.toLowerCase()) {
    case "clear":
      return <Sun className={className} />;
    case "clouds":
      return <Cloud className={className} />;
    case "rain":
    case "drizzle":
    case "thunderstorm":
      return <CloudRain className={className} />;
    case "snow":
      return <Snowflake className={className} />;
    default:
      return <Wind className={className} />;
  }
}
