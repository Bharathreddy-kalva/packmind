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

export interface TripAccent {
  border: string;
  bg: string;
  text: string;
  iconBg: string;
  iconText: string;
}

export const TRIP_TYPE_ACCENTS: Record<string, TripAccent> = {
  beach: {
    border: "border-l-cyan-500",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-400",
  },
  business: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-400",
  },
  hiking: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
  },
  city: {
    border: "border-l-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
  },
  camping: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
  },
  ski: {
    border: "border-l-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-400",
  },
  wedding: {
    border: "border-l-pink-500",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    iconBg: "bg-pink-500/10",
    iconText: "text-pink-400",
  },
  backpacking: {
    border: "border-l-lime-500",
    bg: "bg-lime-500/10",
    text: "text-lime-400",
    iconBg: "bg-lime-500/10",
    iconText: "text-lime-400",
  },
};

export const DEFAULT_TRIP_ACCENT: TripAccent = {
  border: "border-l-indigo-500",
  bg: "bg-indigo-500/10",
  text: "text-indigo-400",
  iconBg: "bg-indigo-500/10",
  iconText: "text-indigo-400",
};

export function tripAccent(tripType: string): TripAccent {
  return TRIP_TYPE_ACCENTS[tripType] ?? DEFAULT_TRIP_ACCENT;
}
