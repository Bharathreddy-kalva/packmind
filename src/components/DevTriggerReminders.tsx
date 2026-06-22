"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DevTriggerReminders() {
  const [isLoading, setIsLoading] = useState(false);

  const trigger = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dev/trigger-reminders", {
        method: "POST",
      });
      const data = (await response.json()) as {
        processed?: number;
        riskScans?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to trigger reminders.");
      }

      toast.success(
        `Processed ${data.processed ?? 0} reminder(s) and ${
          data.riskScans ?? 0
        } radar scan(s).`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to trigger reminders."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={trigger}
      disabled={isLoading}
      className="glass glass-hover flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white/70 transition-all disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Bell className="size-4" />
      )}
      Trigger Reminders Now (Dev)
    </button>
  );
}
