import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { differenceInCalendarDays } from "date-fns";
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  Flame,
  Gauge,
  MapPinned,
  Plane,
  Plus,
  Radar,
  Route,
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
    <div className="command-panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <EmptyIllustration />
      <p className="font-semibold text-white/45">{message}</p>
      <Link
        href="/trips/new"
        className="mt-1 text-sm font-bold text-teal-200 transition-colors hover:text-teal-100"
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
  shared,
}: {
  trip: Trip;
  packed: number;
  total: number;
  shared?: boolean;
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
      className="command-panel group flex min-h-64 flex-col p-5 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="status-chip px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-200">
            {trip.trip_type}
          </span>
          {shared && (
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-200">
              Shared
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trip.itinerary_approved && (
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-200">
              Approved
            </span>
          )}
          {countdownLabel && (
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-bold text-amber-200">
              {countdownLabel}
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-5 text-xl font-black tracking-tight text-white">
        {trip.destination}
      </h3>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/46">
        <CalendarDays className="size-4 text-teal-200/70" />
        {trip.departure_date} – {trip.return_date}
      </div>

      <div className="mt-auto pt-7">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-medium text-white/40">
            <span className="uppercase tracking-[0.18em]">Packed</span>
            <span className="text-white/60">{percentage}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="signal-line h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <Route className="size-4 text-amber-200/70" />
            {total} items
          </div>
          {weather && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-white/70">
              <WeatherIcon
                condition={weather.condition}
                className="size-4 text-teal-200"
              />
              {Math.round(weather.temp_max)}°C
            </div>
          )}
        </div>
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

  const { data: collaboratorRows } = user?.id
    ? await supabase
        .from("trip_collaborators")
        .select("trips(*)")
        .eq("user_id", user.id)
    : { data: [] };

  const ownedTrips = (data ?? []) as Trip[];
  const sharedTrips = (
    (collaboratorRows ?? []) as unknown as {
      trips: Trip | Trip[] | null;
    }[]
  )
    .map((row) => (Array.isArray(row.trips) ? row.trips[0] : row.trips))
    .filter((trip): trip is Trip => Boolean(trip));

  const sharedTripIds = new Set(sharedTrips.map((trip) => trip.id));
  const trips = [...ownedTrips];
  for (const trip of sharedTrips) {
    if (!trips.some((existing) => existing.id === trip.id)) {
      trips.push(trip);
    }
  }
  trips.sort((a, b) => a.departure_date.localeCompare(b.departure_date));
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
  const nextTrip = activeTrips[0];
  const nextTripProgress = nextTrip
    ? progressByTrip.get(nextTrip.id) ?? { packed: 0, total: 0 }
    : null;
  const nextTripPercentage =
    nextTripProgress && nextTripProgress.total > 0
      ? Math.round((nextTripProgress.packed / nextTripProgress.total) * 100)
      : 0;

  return (
    <div className="animate-fade-in-up space-y-8">
      <section className="command-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-teal-100">
              <Radar className="size-3.5" />
              Travel command center
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
              {greeting}, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-base font-medium text-white/48">
              Live packing readiness, shared trips, and destination intelligence in one board.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {process.env.NODE_ENV !== "production" && <DevTriggerReminders />}
            <Link
              href="/trips/new"
              className="btn-gradient flex items-center gap-2 text-sm transition-all"
            >
              <Plus className="size-4" />
              Plan New Trip
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="metric-tile p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-teal-300/10 text-teal-100">
                <MapPinned className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/36">
                  Next departure
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {nextTrip ? nextTrip.destination : "No active trip"}
                </p>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="signal-line h-full rounded-full"
                style={{ width: `${nextTripPercentage}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-white/48">
              <span>
                {nextTripProgress
                  ? `${nextTripProgress.packed} of ${nextTripProgress.total} packed`
                  : "Ready when your next trip lands"}
              </span>
              {nextTrip && <span>{nextTrip.departure_date}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="metric-tile p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/36">
                    {stat.label}
                  </p>
                  <stat.icon className="size-4 text-amber-200/80" />
                </div>
                <p className="mt-4 text-3xl font-black tracking-tight text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-white">
            Active Trips
          </h2>
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
                    shared={sharedTripIds.has(trip.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-tight text-white">
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
                    shared={sharedTripIds.has(trip.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="command-panel p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-teal-300/10">
            <Brain className="size-5 text-teal-200" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
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
