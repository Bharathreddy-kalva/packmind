import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { differenceInCalendarDays } from "date-fns";
import {
  Brain,
  CheckCircle2,
  Flame,
  Gauge,
  Plane,
  Plus,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase";
import { WeatherIcon } from "@/components/weather-icon";
import { DevTriggerReminders } from "@/components/DevTriggerReminders";
import type { Trip } from "@/types";

function EmptyIllustration() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="60" cy="60" r="60" fill="#ffffff" fillOpacity="0.05" />
      <rect x="33" y="46" width="54" height="40" rx="6" fill="#ffffff" fillOpacity="0.08" />
      <rect x="33" y="46" width="54" height="12" rx="6" fill="#6366f1" fillOpacity="0.4" />
      <rect x="50" y="38" width="20" height="10" rx="3" fill="#ffffff" fillOpacity="0.1" />
      <circle cx="60" cy="70" r="9" fill="#1a1a1a" />
      <path
        d="M56 70l3 3 6-6"
        stroke="#818cf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyTripsState({ message }: { message: string }) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-16 text-center">
      <EmptyIllustration />
      <p className="font-semibold text-white/30">{message}</p>
      <Link
        href="/trips/new"
        className="mt-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
      >
        Plan a trip &rarr;
      </Link>
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
      className="glass-hover group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-[20px] transition-all duration-200 hover:scale-[1.01]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold capitalize text-white/60">
          {trip.trip_type}
        </span>
        <div className="flex items-center gap-2">
          {trip.itinerary_approved && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Approved
            </span>
          )}
          {countdownLabel && (
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
              {countdownLabel}
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">
        {trip.destination}
      </h3>
      <p className="mt-1 text-sm text-white/40">
        {trip.departure_date} – {trip.return_date}
      </p>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-medium text-white/40">
            <span>Packed</span>
            <span className="text-white/60">{percentage}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        {weather && (
          <div className="ml-4 flex items-center gap-1.5 text-sm font-medium text-white/60">
            <WeatherIcon
              condition={weather.condition}
              className="size-4 text-indigo-400"
            />
            {Math.round(weather.temp_max)}°C
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
    },
    {
      label: "Completed",
      value: pastTrips.length,
      icon: CheckCircle2,
    },
    {
      label: "Avg Packed",
      value: avgPacked !== null ? `${avgPacked}%` : "—",
      icon: Gauge,
    },
    {
      label: "Streak",
      value: streak,
      icon: Flame,
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-white/40">
            Here&apos;s an overview of your trips and packing progress.
          </p>
        </div>
        {process.env.NODE_ENV !== "production" && <DevTriggerReminders />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass glass-hover rounded-2xl p-6"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <stat.icon className="size-5 text-indigo-400" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Active Trips
          </h2>
          <Link
            href="/trips/new"
            className="btn-gradient flex items-center gap-1.5 text-sm transition-all"
          >
            <Plus className="size-4" />
            Plan New Trip
          </Link>
        </div>
        <div className="mt-4">
          {activeTrips.length === 0 ? (
            <EmptyTripsState message="No active trips yet" />
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
        <h2 className="text-xl font-bold tracking-tight text-white">
          Past Trips
        </h2>
        <div className="mt-4">
          {pastTrips.length === 0 ? (
            <EmptyTripsState message="No past trips yet" />
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

      <div className="glass rounded-2xl p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10">
            <Brain className="size-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Your Packing DNA
          </h2>
        </div>
        <p className="mt-4 text-white/50">
          Complete a few trips to unlock your packing insights.
        </p>
      </div>
    </div>
  );
}
