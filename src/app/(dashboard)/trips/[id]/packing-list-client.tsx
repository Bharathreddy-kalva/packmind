"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  FileText,
  Heart,
  Laptop,
  Lightbulb,
  Loader2,
  MapPin,
  Package,
  PackageOpen,
  Plus,
  Share2,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tripGradient, TRIP_TYPE_ICONS } from "@/lib/trip-style";
import { WeatherIcon } from "@/components/weather-icon";
import type { PackingItem, Trip } from "@/types";

const CATEGORIES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "clothing", label: "Clothing", icon: Shirt },
  { key: "toiletries", label: "Toiletries", icon: Sparkles },
  { key: "electronics", label: "Electronics", icon: Laptop },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "health", label: "Health", icon: Heart },
  { key: "misc", label: "Misc", icon: Package },
];

const DESTINATION_SPECIFIC_PATTERN = /\s*\[(.+)-specific\]$/i;

function parseItemName(name: string): {
  displayName: string;
  isDestinationSpecific: boolean;
} {
  const match = name.match(DESTINATION_SPECIFIC_PATTERN);
  if (!match || match.index === undefined) {
    return { displayName: name, isDestinationSpecific: false };
  }
  return {
    displayName: name.slice(0, match.index).trim(),
    isDestinationSpecific: true,
  };
}

export function PackingListClient({
  trip,
  initialItems,
}: {
  trip: Trip;
  initialItems: PackingItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((category) => [category.key, true]))
  );
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [displayProgress, setDisplayProgress] = useState(0);
  const [intelExpanded, setIntelExpanded] = useState(true);
  const [isRegeneratingIntel, setIsRegeneratingIntel] = useState(false);
  const destinationIntel = trip.destination_intel;
  const confettiFiredRef = useRef(false);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, PackingItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  const essentialItemReasons = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of destinationIntel?.essentialItems ?? []) {
      map.set(item.name.toLowerCase().trim(), item.reason);
    }
    return map;
  }, [destinationIntel]);

  const packedCount = items.filter((item) => item.is_packed).length;
  const totalCount = items.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplayProgress(progress));
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  useEffect(() => {
    if (totalCount > 0 && packedCount === totalCount) {
      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true;
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#a855f7", "#22d3ee"],
        });
      }
    } else {
      confettiFiredRef.current = false;
    }
  }, [packedCount, totalCount]);

  const today = new Date().toISOString().slice(0, 10);
  const tripEnded = today > trip.return_date;
  const weather = trip.weather_data?.[0];
  const gradient = tripGradient(trip.trip_type);
  const HeroIcon = TRIP_TYPE_ICONS[trip.trip_type] ?? MapPin;

  const toggleCategory = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePacked = async (item: PackingItem) => {
    const nextPacked = !item.is_packed;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_packed: nextPacked } : i))
    );

    const response = await fetch(`/api/trips/${trip.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: item.id, is_packed: nextPacked }),
    });

    if (!response.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_packed: item.is_packed } : i
        )
      );
      toast.error("Failed to update item.");
    }
  };

  const addItem = async (category: string) => {
    const name = newItemName.trim();
    if (!name) return;

    const response = await fetch(`/api/trips/${trip.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Failed to add item.");
      return;
    }

    setItems((prev) => [...prev, data.item as PackingItem]);
    setNewItemName("");
    setAddingTo(null);
  };

  const handleRegenerateIntel = async () => {
    setIsRegeneratingIntel(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate destination insights.");
      }

      toast.success("Destination insights ready!");
      window.location.reload();
    } catch {
      toast.error("Failed to generate destination insights.");
      setIsRegeneratingIntel(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/trips/${trip.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl space-y-6 pb-24 pt-10">
      {/* Hero */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br p-8",
          gradient
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/80">
              <HeroIcon className="size-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {trip.trip_type}
              </span>
            </div>
            <h1 className="mt-2 text-4xl font-bold text-white">
              {trip.destination}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/80">
              <Calendar className="size-4" />
              {trip.departure_date} – {trip.return_date}
            </div>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/30"
          >
            <Share2 className="size-4" />
            Share
          </button>
        </div>

        {weather ? (
          <div className="relative mt-6 flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
            <WeatherIcon
              condition={weather.condition}
              className="size-8 text-white"
            />
            <div>
              <p className="text-lg font-semibold text-white">
                {Math.round(weather.temp_min)}° – {Math.round(weather.temp_max)}°C
              </p>
              <p className="text-sm capitalize text-white/70">
                {weather.description}
              </p>
            </div>
            {weather.precipitation_chance > 0 && (
              <div className="ml-auto text-sm text-white/70">
                {weather.precipitation_chance}% chance of rain
              </div>
            )}
          </div>
        ) : (
          <div className="relative mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70 backdrop-blur-sm">
            Weather data isn&apos;t available for this trip yet.
          </div>
        )}

        {/* Progress */}
        <div className="relative mt-6">
          <div className="flex items-center justify-between text-sm font-medium text-white/90">
            <span>Packing progress</span>
            <span>
              {packedCount} of {totalCount} items packed
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-1000 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Destination Intel */}
      {destinationIntel ? (
        <div className="card-glow rounded-xl border border-slate-700 bg-slate-900">
          <button
            type="button"
            onClick={() => setIntelExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between gap-4 p-4"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                <MapPin className="size-4 text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  Know Before You Go — {trip.destination}
                </p>
                {destinationIntel.climate && (
                  <p className="mt-0.5 text-xs capitalize text-slate-400">
                    Climate: {destinationIntel.climate}
                  </p>
                )}
              </div>
            </div>
            {intelExpanded ? (
              <ChevronUp className="size-5 shrink-0 text-slate-500" />
            ) : (
              <ChevronDown className="size-5 shrink-0 text-slate-500" />
            )}
          </button>

          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              intelExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 border-t border-slate-700 p-4">
                {destinationIntel.culturalNotes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                      <AlertTriangle className="size-4" />
                      Cultural Notes
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {destinationIntel.culturalNotes.map((note) => (
                        <span
                          key={note}
                          className="rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-xs text-amber-400"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {destinationIntel.weatherWarnings.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                      <Cloud className="size-4" />
                      Weather Heads Up
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {destinationIntel.weatherWarnings.map((warning) => (
                        <span
                          key={warning}
                          className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-xs text-blue-400"
                        >
                          {warning}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {destinationIntel.localTips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                      <Lightbulb className="size-4" />
                      Local Tips
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {destinationIntel.localTips.map((tip) => (
                        <span
                          key={tip}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400"
                        >
                          {tip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-glow flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
              <MapPin className="size-4 text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Know Before You Go</p>
              <p className="text-xs text-slate-400">
                Get cultural notes, weather warnings, and local tips for{" "}
                {trip.destination}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRegenerateIntel}
            disabled={isRegeneratingIntel}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegeneratingIntel ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Regenerate for destination insights
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {CATEGORIES.map(({ key, label, icon: Icon }) => {
          const categoryItems = itemsByCategory.get(key) ?? [];
          const isExpanded = expanded[key] ?? true;
          const categoryPacked = categoryItems.filter(
            (item) => item.is_packed
          ).length;

          return (
            <div
              key={key}
              className="card-glow rounded-xl border border-slate-800 bg-slate-900"
            >
              <button
                type="button"
                onClick={() => toggleCategory(key)}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-indigo-500/10">
                    <Icon className="size-4 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{label}</p>
                    <p className="text-xs text-slate-400">
                      {categoryItems.length === 0
                        ? "No items yet"
                        : `${categoryPacked} of ${categoryItems.length} packed`}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="size-5 text-slate-500" />
                ) : (
                  <ChevronDown className="size-5 text-slate-500" />
                )}
              </button>

              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 border-t border-slate-800 p-4">
                    {categoryItems.map((item, index) => {
                      const { displayName, isDestinationSpecific } =
                        parseItemName(item.name);
                      const reason = isDestinationSpecific
                        ? essentialItemReasons.get(
                            displayName
                              .toLowerCase()
                              .replace(/\s*\(x\d+\)$/, "")
                              .trim()
                          )
                        : undefined;

                      return (
                        <label
                          key={item.id}
                          style={{ animationDelay: `${index * 40}ms` }}
                          className="animate-fade-in-up flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-800/50"
                        >
                          <button
                            type="button"
                            onClick={() => togglePacked(item)}
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
                              item.is_packed
                                ? "scale-105 border-indigo-500 bg-indigo-500 text-white"
                                : "border-slate-600 bg-slate-950 hover:border-indigo-400"
                            )}
                          >
                            <Check
                              className={cn(
                                "size-3.5 transition-transform duration-200",
                                item.is_packed ? "scale-100" : "scale-0"
                              )}
                            />
                          </button>
                          <span className="relative flex-1 text-sm">
                            <span
                              className={cn(
                                "transition-colors duration-300",
                                item.is_packed
                                  ? "text-slate-500"
                                  : "text-white"
                              )}
                            >
                              {displayName}
                            </span>
                            <span
                              aria-hidden
                              className={cn(
                                "absolute left-0 top-1/2 h-px w-full origin-left -translate-y-1/2 scale-x-0 bg-slate-500 transition-transform duration-300 ease-out",
                                item.is_packed && "scale-x-100"
                              )}
                            />
                          </span>
                          {isDestinationSpecific && (
                            <span
                              title={
                                reason ?? "Recommended for this destination"
                              }
                              className="shrink-0 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300"
                            >
                              Local Tip
                            </span>
                          )}
                        </label>
                      );
                    })}

                    {addingTo === key ? (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          autoFocus
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addItem(key);
                            if (e.key === "Escape") {
                              setAddingTo(null);
                              setNewItemName("");
                            }
                          }}
                          placeholder="Item name"
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => addItem(key)}
                          className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingTo(null);
                            setNewItemName("");
                          }}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingTo(key)}
                        className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                      >
                        <Plus className="size-4" />
                        Add custom item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unpack mode */}
      <button
        type="button"
        disabled={!tripEnded}
        onClick={() => toast.info("Unpack Mode is coming soon!")}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none"
      >
        <PackageOpen className="size-5" />
        {tripEnded
          ? "Start Unpack Mode"
          : "Unpack Mode unlocks after your trip"}
      </button>

      {/* Floating items-left badge */}
      {totalCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-fade-in-up rounded-full border border-indigo-500/40 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 backdrop-blur-md">
          {totalCount - packedCount === 0
            ? "All packed!"
            : `${totalCount - packedCount} items left to pack`}
        </div>
      )}
    </div>
  );
}
