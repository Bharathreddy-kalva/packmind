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

export interface ResourceWarning {
  type: "gas" | "food" | "medical" | "connectivity" | "water" | "atm" | string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
}

export interface GasStationResource {
  name: string;
  distance: string;
  address: string;
  notes: string;
}

export interface RestaurantResource {
  name: string;
  distance: string;
  cuisine: string;
  hours: string;
  notes: string;
}

export interface GroceryStoreResource {
  name: string;
  distance: string;
  hours: string;
  notes: string;
}

export interface HospitalResource {
  name: string;
  distance: string;
  phone: string;
  emergency: boolean;
}

export interface AttractionResource {
  name: string;
  type: string;
  duration: string;
  difficulty: string;
  notes: string;
}

export interface NearbyResources {
  gasStations: GasStationResource[];
  restaurants: RestaurantResource[];
  groceryStores: GroceryStoreResource[];
  hospitals: HospitalResource[];
  attractions: AttractionResource[];
}

export interface ScheduleItem {
  time: string;
  activity: string;
  duration: string;
  notes: string;
  type:
    | "travel"
    | "essential"
    | "arrival"
    | "activity"
    | "food"
    | "leisure"
    | string;
}

export interface DayPlan {
  day: number;
  date: string;
  theme: string;
  weather: string;
  schedule: ScheduleItem[];
  warnings: string[];
  essentialItems: string[];
}

export interface EmergencyInfo {
  nearestHospital: string;
  emergencyNumber: string;
  rangerStation: string;
  evacuationRoutes: string;
}

export interface AutoAddItem {
  name: string;
  category: string;
  reason: string;
}

export interface TripIntelligence {
  resourceWarnings: ResourceWarning[];
  nearbyResources: NearbyResources;
  dayByDayPlan: DayPlan[];
  emergencyInfo: EmergencyInfo;
  mustKnow: string[];
  autoAddItems: AutoAddItem[];
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
  trip_intelligence: TripIntelligence | null;
  status: string;
  itinerary_approved: boolean;
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
