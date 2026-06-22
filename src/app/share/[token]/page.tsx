import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Calendar, CheckCircle2, Clock, MapPin, Package } from "lucide-react";
import { AcceptTripInvite } from "@/components/AcceptTripInvite";
import { AtmosphericBackground } from "@/components/atmospheric-background";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { PackingItem, Trip } from "@/types";

interface InviteWithTrip {
  token: string;
  expires_at: string;
  trips:
    | (Trip & {
        packing_items: PackingItem[];
      })
    | (Trip & {
        packing_items: PackingItem[];
      })[]
    | null;
}

function InviteUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 text-white">
      <AtmosphericBackground />
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-white/50">{message}</p>
        <Link
          href="/"
          className="btn-gradient mt-6 inline-flex text-sm transition-all"
        >
          Back to PackMind
        </Link>
      </div>
    </div>
  );
}

export default async function ShareInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("trip_invites")
    .select("token, expires_at, trips(*, packing_items(*))")
    .eq("token", token)
    .single();

  if (!data) {
    return (
      <InviteUnavailable
        title="Invite not found"
        message="This sharing link is invalid or has been removed."
      />
    );
  }

  const invite = data as unknown as InviteWithTrip;
  const expiresAt = new Date(invite.expires_at).toISOString();
  const now = new Date().toISOString();
  if (expiresAt < now) {
    return (
      <InviteUnavailable
        title="Invite expired"
        message="Ask the trip owner for a fresh invite link."
      />
    );
  }

  const trip = Array.isArray(invite.trips) ? invite.trips[0] : invite.trips;
  if (!trip) {
    return (
      <InviteUnavailable
        title="Trip unavailable"
        message="This trip is no longer available."
      />
    );
  }

  const packedCount = trip.packing_items.filter((item) => item.is_packed).length;
  const totalCount = trip.packing_items.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);

  return (
    <div className="relative min-h-screen px-6 py-10 text-white">
      <AtmosphericBackground />

      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center">
        <div className="glass w-full rounded-2xl p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
                Shared PackMind Trip
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {trip.destination}
              </h1>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
              <Package className="size-6 text-indigo-400" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Calendar className="size-4" />
                Dates
              </div>
              <p className="mt-1 font-semibold">
                {trip.departure_date} - {trip.return_date}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin className="size-4" />
                Trip type
              </div>
              <p className="mt-1 font-semibold capitalize">{trip.trip_type}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white/5 p-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2 text-white/40">
                <CheckCircle2 className="size-4" />
                Packing progress
              </span>
              <span>
                {packedCount} of {totalCount} packed
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-white/40" />
              <p className="text-sm text-white/50">
                Joining lets you open the live packing list, check off shared
                items, and keep the group progress up to date.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <AcceptTripInvite token={token} isSignedIn={Boolean(userId)} />
            <Link
              href="/"
              className="btn-ghost inline-flex px-4 py-2 text-sm font-medium transition-all"
            >
              Learn about PackMind
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
