export interface Profile {
  id: string;
  phone_number: string | null;
  travel_style: string | null;
  created_at: string;
}

export interface WeatherDataPoint {
  date: string;
  temp_min: number;
  temp_max: number;
  condition: string;
  description: string;
  icon: string;
  precipitation_chance: number;
}

export interface DestinationEssentialItem {
  name: string;
  reason: string;
  category: string;
}

export interface DestinationIntel {
  climate: string;
  essentialItems: DestinationEssentialItem[];
  culturalNotes: string[];
  weatherWarnings: string[];
  localTips: string[];
}

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  departure_date: string;
  return_date: string;
  trip_type: string;
  activities: string[];
  weather_data: WeatherDataPoint[] | null;
  destination_intel: DestinationIntel | null;
  status: string;
  created_at: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  category: string;
  is_packed: boolean;
  is_used: boolean;
  ai_suggested: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  trip_id: string;
  user_id: string;
  remind_at: string;
  message: string;
  sent: boolean;
  created_at: string;
}

export interface ItemHistory {
  id: string;
  user_id: string;
  item_name: string;
  trip_type: string;
  times_packed: number;
  times_used: number;
  times_forgotten: number;
  updated_at: string;
}
