"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  FileWarning,
  HeartPulse,
  Loader2,
  Plane,
  Radar,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PackingItem, TripRiskRadar as TripRiskRadarData } from "@/types";

const RISK_ICONS: Record<string, LucideIcon> = {
  weather: CloudRain,
  strike: Plane,
  visa: FileWarning,
  health: HeartPulse,
  airport: Plane,
  closure: ShieldAlert,
  packing: Sparkles,
};

const RISK_STYLES: Record<string, { border: string; text: string; bg: string }> = {
  high: {
    border: "border-red-500/30",
    text: "text-red-300",
    bg: "bg-red-500/10",
  },
  medium: {
    border: "border-amber-500/30",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
  },
  low: {
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
  },
};

function formatScanTime(value: string | null | undefined) {
  if (!value) return "Not scanned yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TripRiskRadar({
  tripId,
  initialRadar,
  onItemsAdded,
}: {
  tripId: string;
  initialRadar: TripRiskRadarData | null;
  onItemsAdded: (items: PackingItem[]) => void;
}) {
  const [radar, setRadar] = useState(initialRadar);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const level = radar?.riskLevel ?? "low";
  const style = RISK_STYLES[level] ?? RISK_STYLES.low;

  const refreshRadar = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/risk-radar`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        riskRadar?: TripRiskRadarData;
        addedItems?: PackingItem[];
        error?: string;
      };

      if (!response.ok || !data.riskRadar) {
        throw new Error(data.error ?? "Failed to refresh Trip Risk Radar.");
      }

      setRadar(data.riskRadar);
      if (data.addedItems?.length) {
        onItemsAdded(data.addedItems);
      }
      toast.success(
        data.addedItems?.length
          ? `Radar refreshed and added ${data.addedItems.length} packing item(s).`
          : "Trip Risk Radar refreshed."
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh Trip Risk Radar."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={cn("command-panel border p-5", style.border)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", style.bg)}>
            <Radar className={cn("size-5", style.text)} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-white">Trip Risk Radar</h2>
              <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]", style.bg, style.text)}>
                {level} risk
              </span>
            </div>
            <p className="mt-1 text-sm text-white/50">
              {radar?.headline ?? "Scan for weather changes, disruption risks, and packing impacts."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshRadar}
          disabled={isRefreshing}
          className="btn-ghost flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          Scan now
        </button>
      </div>

      {radar ? (
        <div className="mt-5 space-y-4">
          <div className="metric-tile p-4">
            <p className="text-sm text-white/70">{radar.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/35">
              <span>Last scan: {formatScanTime(radar.lastScannedAt)}</span>
              <span>•</span>
              <span>{radar.nextScanReason}</span>
            </div>
          </div>

          {radar.weatherChange?.changed && (
            <div className="flex items-start gap-3 rounded-lg border border-sky-300/24 bg-sky-300/10 p-4">
              <CloudRain className="mt-0.5 size-4 shrink-0 text-sky-200" />
              <div>
                <p className="text-sm font-bold text-sky-100">
                  Your trip changed
                </p>
                <p className="mt-1 text-sm text-sky-100/70">
                  {radar.weatherChange.summary}
                </p>
              </div>
            </div>
          )}

          {radar.alerts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {radar.alerts.map((alert, index) => {
                const Icon = RISK_ICONS[alert.type] ?? AlertTriangle;
                const alertStyle =
                  RISK_STYLES[alert.severity] ?? RISK_STYLES.low;

                return (
                  <div
                    key={`${alert.title}-${index}`}
                    className={cn("rounded-lg border p-4", alertStyle.border, alertStyle.bg)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("mt-0.5 size-4 shrink-0", alertStyle.text)} />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          {alert.description}
                        </p>
                        {alert.impact && (
                          <p className="mt-2 text-xs text-white/40">
                            Impact: {alert.impact}
                          </p>
                        )}
                        {alert.action && (
                          <p className={cn("mt-2 text-xs font-semibold", alertStyle.text)}>
                            {alert.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-300/24 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 className="size-4" />
              No urgent changes detected.
            </div>
          )}

          {radar.packingImpacts.length > 0 && (
            <div className="metric-tile p-4">
              <p className="text-sm font-semibold text-white">
                Packing impacts
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {radar.packingImpacts.map((impact, index) => (
                  <span
                    key={`${impact.itemName}-${index}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                  >
                    {impact.itemName} · {impact.bag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="metric-tile mt-5 p-4 text-sm text-white/45">
          Run a scan to let PackMind watch the trip for weather shifts,
          airport disruption patterns, document checks, health prep, and
          packing changes.
        </div>
      )}
    </div>
  );
}
