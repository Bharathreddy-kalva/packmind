"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";

export function GeneratePackingList({
  tripId,
  destination,
  departureDate,
  returnDate,
}: {
  tripId: string;
  destination: string;
  departureDate: string;
  returnDate: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const calledRef = useRef(false);

  const generateList = useCallback(async () => {
    setError(false);
    try {
      const response = await fetch(`/api/trips/${tripId}/generate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate packing list.");
      }

      router.refresh();
    } catch {
      setError(true);
      setIsRetrying(false);
    }
  }, [tripId, router]);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    generateList();
  }, [generateList]);

  const handleRetry = () => {
    setIsRetrying(true);
    generateList();
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="glass animate-fade-in-up rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            Couldn&apos;t generate your packing list
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Something went wrong while talking to the AI. Try again below.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="btn-gradient mt-6 inline-flex items-center gap-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetrying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo-500/10 animate-pulse-glow">
          <Loader2 className="size-7 animate-spin text-indigo-400" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Generating your packing list...
        </h1>
        <p className="mt-2 text-lg font-medium text-white">{destination}</p>
        <p className="mt-1 text-sm text-white/40">
          {departureDate} – {returnDate}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
          <Sparkles className="size-4" />
          Claude is packing your bags...
        </div>
      </div>
    </div>
  );
}
