import {
  Backpack,
  Briefcase,
  Building,
  Heart,
  Mountain,
  Palmtree,
  Snowflake,
  Tent,
  type LucideIcon,
} from "lucide-react";

export const TRIP_TYPE_GRADIENTS: Record<string, string> = {
  beach: "from-cyan-400 to-blue-600",
  business: "from-slate-500 to-slate-700",
  hiking: "from-green-500 to-emerald-700",
  city: "from-purple-500 to-fuchsia-600",
  camping: "from-orange-500 to-amber-600",
  ski: "from-sky-400 to-indigo-600",
  wedding: "from-pink-500 to-rose-600",
  backpacking: "from-yellow-500 to-lime-600",
};

export const DEFAULT_TRIP_GRADIENT = "from-indigo-500 to-purple-600";

export function tripGradient(tripType: string): string {
  return TRIP_TYPE_GRADIENTS[tripType] ?? DEFAULT_TRIP_GRADIENT;
}

export const TRIP_TYPE_ICONS: Record<string, LucideIcon> = {
  beach: Palmtree,
  business: Briefcase,
  hiking: Mountain,
  city: Building,
  camping: Tent,
  ski: Snowflake,
  wedding: Heart,
  backpacking: Backpack,
};
