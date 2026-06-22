"use client";

import { Component, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Car,
  Check,
  CheckCircle2,
  Cloud,
  Compass,
  Droplets,
  Fuel,
  Heart,
  Loader2,
  MapPin,
  Pencil,
  Radar,
  Shield,
  ShoppingCart,
  Star,
  Utensils,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TripIntelligence as TripIntelligenceData } from "@/types";

const WARNING_ICONS: Record<string, LucideIcon> = {
  gas: Fuel,
  food: ShoppingCart,
  medical: Heart,
  connectivity: WifiOff,
  water: Droplets,
  atm: Banknote,
};

const SEVERITY_BORDER: Record<string, string> = {
  high: "rgba(239,68,68,0.5)",
  medium: "rgba(245,158,11,0.5)",
  low: "rgba(34,197,94,0.5)",
};

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

const RESOURCE_TABS = [
  { key: "gas", label: "Gas Stations", icon: Fuel },
  { key: "food", label: "Food", icon: Utensils },
  { key: "medical", label: "Medical", icon: Heart },
  { key: "attractions", label: "Attractions", icon: Compass },
] as const;

type ResourceTabKey = (typeof RESOURCE_TABS)[number]["key"];

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  travel: Car,
  essential: AlertCircle,
  arrival: MapPin,
  activity: Compass,
  food: Utensils,
  leisure: Star,
};

const ACTIVITY_COLORS: Record<string, string> = {
  essential: "text-amber-400",
  food: "text-amber-300",
  activity: "text-teal-300",
  travel: "text-slate-400",
  leisure: "text-fuchsia-300",
  arrival: "text-emerald-400",
};

const cardStyle: CSSProperties = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.024)), rgba(6,10,16,0.5)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "24px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 70px rgba(0,0,0,0.28)",
};

const resourceItemClass =
  "rounded-lg border border-white/[0.08] bg-white/[0.035] p-4";

function TripIntelligenceContent({
  data,
  destination,
  tripId,
  approved,
  onRegenerated,
}: {
  data: TripIntelligenceData;
  destination: string;
  tripId: string;
  approved: boolean;
  onRegenerated?: (data: TripIntelligenceData) => void;
}) {
  const [activeResourceTab, setActiveResourceTab] =
    useState<ResourceTabKey>("gas");
  const [isApproved, setIsApproved] = useState(approved);
  const [isApproving, setIsApproving] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const resources = data?.nearbyResources;
  const gasStations = resources?.gasStations ?? [];
  const restaurants = resources?.restaurants ?? [];
  const groceryStores = resources?.groceryStores ?? [];
  const hospitals = resources?.hospitals ?? [];
  const attractions = resources?.attractions ?? [];
  const resourceWarnings = data?.resourceWarnings ?? [];
  const mustKnow = data?.mustKnow ?? [];
  const dayByDayPlan = data?.dayByDayPlan ?? [];
  const emergencyInfo = data?.emergencyInfo;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/approve`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to approve itinerary.");
      }
      setIsApproved(true);
      toast.success("Itinerary approved! Have a great trip!");
    } catch {
      toast.error("Failed to approve itinerary.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!feedback.trim()) return;
    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/intelligence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to regenerate plan.");
      }

      onRegenerated?.(result.intelligence as TripIntelligenceData);
      toast.success("Itinerary updated!");
      setShowFeedback(false);
      setFeedback("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to regenerate plan."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resource Warnings */}
      <div style={cardStyle}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-300/10">
            <Radar className="size-5 text-amber-200" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Pre-Trip Intelligence Report
            </h2>
            <p className="text-sm text-white/50">
              AI-researched conditions for {destination}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {resourceWarnings.map((warning, index) => {
            const Icon = WARNING_ICONS[warning.type] ?? AlertTriangle;
            const borderColor =
              SEVERITY_BORDER[warning.severity] ?? SEVERITY_BORDER.low;
            const dotColor =
              SEVERITY_DOT[warning.severity] ?? SEVERITY_DOT.low;

            return (
              <div
                key={index}
                style={{ borderLeft: `3px solid ${borderColor}` }}
                className="rounded-xl bg-white/[0.03] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Icon className="size-4 text-white/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("size-2 shrink-0 rounded-full", dotColor)}
                      />
                      <p className="font-semibold text-white">
                        {warning.title}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      {warning.description}
                    </p>
                      <p className="mt-2 text-sm font-bold text-amber-200">
                        &rarr; {warning.action}
                      </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What's Available Nearby */}
      {resources && (
        <div style={cardStyle}>
          <h3 className="text-base font-bold text-white">
            What&apos;s Available Nearby
          </h3>

          <div className="mt-4 flex flex-wrap gap-2">
            {RESOURCE_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveResourceTab(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeResourceTab === key
                    ? "border-white/[0.15] bg-white/[0.08] text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/70"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {activeResourceTab === "gas" &&
              (gasStations.length > 0 ? (
                gasStations.map((station, index) => (
                  <div key={index} className={resourceItemClass}>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-white/40" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-semibold text-white">
                            {station.name}
                          </p>
                          <p className="text-sm font-medium text-orange-400">
                            {station.distance}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-white/50">
                          {station.address}
                        </p>
                        {station.notes && (
                          <p className="mt-1 text-xs text-white/40">
                            {station.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyResourceState />
              ))}

            {activeResourceTab === "food" &&
              (restaurants.length > 0 || groceryStores.length > 0 ? (
                <>
                  {restaurants.map((restaurant, index) => (
                    <div key={`r-${index}`} className={resourceItemClass}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-white">
                          {restaurant.name}
                        </p>
                        <p className="text-sm font-medium text-orange-400">
                          {restaurant.distance}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-white/50">
                        {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                        {restaurant.hours && (
                          <span className="text-white/40">
                            &bull; {restaurant.hours}
                          </span>
                        )}
                      </div>
                      {restaurant.notes && (
                        <p className="mt-1 text-xs text-white/40">
                          {restaurant.notes}
                        </p>
                      )}
                    </div>
                  ))}
                  {groceryStores.map((store, index) => (
                    <div key={`g-${index}`} className={resourceItemClass}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-white">
                          {store.name}
                        </p>
                        <p className="text-sm font-medium text-orange-400">
                          {store.distance}
                        </p>
                      </div>
                      {store.hours && (
                        <p className="mt-1 text-sm text-white/50">
                          {store.hours}
                        </p>
                      )}
                      {store.notes && (
                        <p className="mt-1 text-xs text-white/40">
                          {store.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <EmptyResourceState />
              ))}

            {activeResourceTab === "medical" &&
              (hospitals.length > 0 ? (
                hospitals.map((hospital, index) => (
                  <div key={index} className={resourceItemClass}>
                    <div className="flex items-start gap-3">
                      <Heart className="mt-0.5 size-4 shrink-0 text-white/40" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-semibold text-white">
                            {hospital.name}
                          </p>
                          <p className="text-sm font-medium text-orange-400">
                            {hospital.distance}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-white/50">
                          {hospital.phone}
                        </p>
                        {hospital.emergency && (
                          <span className="mt-2 inline-block rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                            Emergency Room
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyResourceState />
              ))}

            {activeResourceTab === "attractions" &&
              (attractions.length > 0 ? (
                attractions.map((attraction, index) => (
                  <div key={index} className={resourceItemClass}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">
                        {attraction.name}
                      </p>
                      {attraction.type && (
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                          {attraction.type}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attraction.duration && (
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
                          {attraction.duration}
                        </span>
                      )}
                      {attraction.difficulty && (
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
                          {attraction.difficulty}
                        </span>
                      )}
                    </div>
                    {attraction.notes && (
                      <p className="mt-2 text-xs text-white/40">
                        {attraction.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <EmptyResourceState />
              ))}
          </div>
        </div>
      )}

      {/* Must Know */}
      {mustKnow.length > 0 && (
        <div style={cardStyle}>
          <h3 className="text-base font-bold text-white">Must Know</h3>
          <ul className="mt-4 space-y-3">
            {mustKnow.map((fact, index) => (
              <li key={index} className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <span className="text-sm text-white/80">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Your AI-Planned Itinerary */}
      {dayByDayPlan.length > 0 && (
        <div style={cardStyle}>
          <h3 className="text-base font-bold text-white">
            Your AI-Planned Itinerary
          </h3>
          <div className="mt-4 space-y-4">
            {dayByDayPlan.map((day) => (
              <div
                key={day.day}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">
                      Day {day.day} &middot; {day.theme}
                    </p>
                    <p className="text-xs text-white/40">{day.date}</p>
                  </div>
                  {day.weather && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                      <Cloud className="size-3.5" />
                      {day.weather}
                    </span>
                  )}
                </div>

                {(day.schedule ?? []).length > 0 && (
                  <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
                    {(day.schedule ?? []).map((item, index) => {
                      const Icon = ACTIVITY_ICONS[item.type] ?? Compass;
                      const color =
                        ACTIVITY_COLORS[item.type] ?? "text-white/60";
                      return (
                        <div key={index} className="flex gap-3 text-sm">
                          <Icon className={cn("mt-0.5 size-4 shrink-0", color)} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="font-mono text-white/40">
                                {item.time}
                              </span>
                              <p className="font-medium text-white">
                                {item.activity}
                              </p>
                              {item.duration && (
                                <span className="text-xs text-white/30">
                                  {item.duration}
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="mt-0.5 text-xs text-white/40">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(day.warnings ?? []).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(day.warnings ?? []).map((warning, index) => (
                      <span
                        key={index}
                        className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-400"
                      >
                        {warning}
                      </span>
                    ))}
                  </div>
                )}

                {(day.essentialItems ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/30">
                      Packing focus
                    </span>
                    {(day.essentialItems ?? []).map((item, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Approval flow */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isApproved ? (
              <button
                type="button"
                disabled
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-400"
              >
                <CheckCircle2 className="size-4" />
                Itinerary Approved
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="btn-gradient flex flex-1 items-center justify-center gap-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApproving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Approve This Itinerary
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowFeedback((prev) => !prev)}
              className="btn-ghost flex flex-1 items-center justify-center gap-2 text-sm transition-all"
            >
              <Pencil className="size-4" />
              Suggest Changes
            </button>
          </div>

          {showFeedback && (
            <div className="mt-4 space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Move Day 2 hiking to the morning"
                rows={3}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/[0.15]"
              />
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating || !feedback.trim()}
                className="btn-gradient flex items-center gap-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pencil className="size-4" />
                )}
                Regenerate Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Emergency Info */}
      <div
        style={{
          ...cardStyle,
          background: "rgba(239,68,68,0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <Shield className="size-5 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-white">Emergency Info</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/30">
              Nearest Hospital
            </p>
            <p className="mt-1 text-sm text-white/80">
              {emergencyInfo?.nearestHospital ?? "Not available"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/30">
              Emergency Number
            </p>
            <p className="mt-1 text-sm text-white/80">
              {emergencyInfo?.emergencyNumber ?? "Not available"}
            </p>
          </div>
          {emergencyInfo?.rangerStation && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/30">
                Ranger Station
              </p>
              <p className="mt-1 text-sm text-white/80">
                {emergencyInfo.rangerStation}
              </p>
            </div>
          )}
          {emergencyInfo?.evacuationRoutes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/30">
                Evacuation Routes
              </p>
              <p className="mt-1 text-sm text-white/80">
                {emergencyInfo.evacuationRoutes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IntelligenceErrorBoundaryState {
  hasError: boolean;
}

class IntelligenceErrorBoundary extends Component<
  { children: ReactNode },
  IntelligenceErrorBoundaryState
> {
  state: IntelligenceErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[TripIntelligence] Failed to render report:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={cardStyle}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Couldn&apos;t display the intelligence report
              </h2>
              <p className="text-sm text-white/50">
                The AI response was malformed. Try generating the report
                again.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function TripIntelligence(
  props: Parameters<typeof TripIntelligenceContent>[0]
) {
  return (
    <IntelligenceErrorBoundary>
      <TripIntelligenceContent {...props} />
    </IntelligenceErrorBoundary>
  );
}

function EmptyResourceState() {
  return (
    <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/40">
      No information available for this category.
    </p>
  );
}
