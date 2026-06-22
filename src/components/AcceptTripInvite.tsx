"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AcceptTripInvite({
  token,
  isSignedIn,
}: {
  token: string;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const acceptInvite = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        tripId?: string;
        error?: string;
      };

      if (!response.ok || !data.tripId) {
        throw new Error(data.error ?? "Failed to accept invite.");
      }

      toast.success("Trip added to your dashboard.");
      router.push(`/trips/${data.tripId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept invite."
      );
    } finally {
      setIsAccepting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <Link
        href={`/sign-in?redirect_url=${encodeURIComponent(`/share/${token}`)}`}
        className="btn-gradient inline-flex items-center gap-2 text-sm transition-all"
      >
        Sign in to join trip
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={acceptInvite}
      disabled={isAccepting}
      className="btn-gradient inline-flex items-center gap-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isAccepting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CheckCircle2 className="size-4" />
      )}
      Join shared trip
    </button>
  );
}
