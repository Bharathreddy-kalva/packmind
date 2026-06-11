import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { differenceInCalendarDays } from "date-fns";
import {
  Brain,
  CheckCircle2,
  Flame,
  Gauge,
  MapPin,
  Plane,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase";
import { CircularProgress } from "@/components/circular-progress";
import { WeatherIcon } from "@/components/weather-icon";
import { cn } from "@/lib/utils";
import { tripGradient } from "@/lib/trip-style";
import type { Trip } from "@/types";

function EmptyTripsState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-indigo-500/10">
        <MapPin className="size-7 text-indigo-400" />
      </div>
      <p className="font-medium text-white">No active trips</p>
      <p className="text-sm text-slate-400">Plan your first adventure</p>
    </div>
  );
}

function TripCard({
  trip,
  packed,
  total,
}: {
  trip: Trip;
  packed: number;
  total: number;
}) {
  const gradient = tripGradient(trip.trip_type);
  const percentage = total === 0 ? 0 : Math.round((packed / total) * 100);
  const weather = trip.weather_data?.[0];
  const daysAway = differenceInCalendarDays(
    new Date(trip.departure_date),
    new Date()
  );

  let countdownLabel: string | null = null;
  if (daysAway > 1) countdownLabel = `${daysAway} days away`;
  else if (daysAway === 1) countdownLabel = "Tomorrow";
  else if (daysAway === 0) countdownLabel = "Departing today";

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="card-glow group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-indigo-500/50"
    >
      <div className={cn("relative h-20 bg-gradient-to-br p-4", gradient)}>
        <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold capitalize text-white backdrop-blur-sm">
          {trip.trip_type}
        </span>
        {countdownLabel && (
          <span className="absolute right-4 top-4 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {countdownLabel}
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-white">{trip.destination}</h3>
        <p className="mt-1 text-sm text-slate-400">
          {trip.departure_date} – {trip.return_date}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <CircularProgress percentage={percentage} />
          {weather ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <WeatherIcon
                condition={weather.condition}
                className="size-4 text-indigo-400"
              />
              {Math.round(weather.temp_max)}°C
            </div>
          ) : (
            <span className="text-xs text-slate-500">No weather data</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("departure_date", { ascending: true });

  const trips = (data ?? []) as Trip[];
  const tripIds = trips.map((trip) => trip.id);

  const { data: itemsData } =
    tripIds.length > 0
      ? await supabase
          .from("packing_items")
          .select("trip_id, is_packed")
          .in("trip_id", tripIds)
      : { data: [] as { trip_id: string; is_packed: boolean }[] };

  const progressByTrip = new Map<string, { packed: number; total: number }>();
  for (const item of itemsData ?? []) {
    const entry = progressByTrip.get(item.trip_id) ?? { packed: 0, total: 0 };
    entry.total += 1;
    if (item.is_packed) entry.packed += 1;
    progressByTrip.set(item.trip_id, entry);
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeTrips = trips.filter((trip) => trip.return_date >= today);
  const pastTrips = trips.filter((trip) => trip.return_date < today);

  const tripsWithItems = trips.filter(
    (trip) => (progressByTrip.get(trip.id)?.total ?? 0) > 0
  );
  const avgPacked =
    tripsWithItems.length > 0
      ? Math.round(
          tripsWithItems.reduce((sum, trip) => {
            const progress = progressByTrip.get(trip.id)!;
            return sum + (progress.packed / progress.total) * 100;
          }, 0) / tripsWithItems.length
        )
      : null;

  const sortedPastTrips = [...pastTrips].sort((a, b) =>
    b.departure_date.localeCompare(a.departure_date)
  );
  let streak = 0;
  for (const trip of sortedPastTrips) {
    const progress = progressByTrip.get(trip.id);
    if (progress && progress.total > 0 && progress.packed === progress.total) {
      streak += 1;
    } else {
      break;
    }
  }

  const stats = [
    {
      label: "Total Trips",
      value: trips.length,
      icon: Plane,
      color: "text-indigo-400",
      glow: "bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.25)]",
    },
    {
      label: "Completed",
      value: pastTrips.length,
      icon: CheckCircle2,
      color: "text-emerald-400",
      glow: "bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    },
    {
      label: "Avg Packed",
      value: avgPacked !== null ? `${avgPacked}%` : "—",
      icon: Gauge,
      color: "text-purple-400",
      glow: "bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    },
    {
      label: "Streak",
      value: streak,
      icon: Flame,
      color: "text-orange-400",
      glow: "bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.25)]",
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-10">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-slate-900 p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
            Welcome back
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Hey, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Here&apos;s an overview of your trips and packing progress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card-glow rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                stat.glow
              )}
            >
              <stat.icon className={cn("size-5", stat.color)} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/trips/new"
        className="group relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition-opacity hover:opacity-90 sm:w-auto sm:px-16"
      >
        <span className="relative z-10">Plan New Trip</span>
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
      </Link>

      <section>
        <h2 className="text-xl font-bold tracking-tight">Active Trips</h2>
        <div className="mt-4">
          {activeTrips.length === 0 ? (
            <EmptyTripsState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTrips.map((trip) => {
                const progress = progressByTrip.get(trip.id) ?? {
                  packed: 0,
                  total: 0,
                };
                return (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    packed={progress.packed}
                    total={progress.total}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold tracking-tight">Past Trips</h2>
        <div className="mt-4">
          {pastTrips.length === 0 ? (
            <EmptyTripsState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastTrips.map((trip) => {
                const progress = progressByTrip.get(trip.id) ?? {
                  packed: 0,
                  total: 0,
                };
                return (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    packed={progress.packed}
                    total={progress.total}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="card-glow rounded-xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <Brain className="size-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Your Packing DNA
          </h2>
        </div>
        <p className="mt-4 text-slate-400">
          Complete a few trips to unlock your packing insights
        </p>
      </div>
    </div>
  );
}
