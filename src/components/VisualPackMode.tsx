"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Check,
  FileText,
  Heart,
  Laptop,
  Luggage,
  Package,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackingItem } from "@/types";

type BagZone = "carry-on" | "checked";

const CATEGORY_META: Record<
  string,
  { label: string; icon: LucideIcon; color: string; weight: number; space: number }
> = {
  clothing: {
    label: "Clothes",
    icon: Shirt,
    color: "bg-cyan-300/12 text-cyan-100 border-cyan-300/22",
    weight: 0.35,
    space: 5,
  },
  toiletries: {
    label: "Toiletries",
    icon: Sparkles,
    color: "bg-fuchsia-300/12 text-fuchsia-100 border-fuchsia-300/22",
    weight: 0.25,
    space: 3,
  },
  electronics: {
    label: "Electronics",
    icon: Laptop,
    color: "bg-sky-300/12 text-sky-100 border-sky-300/22",
    weight: 0.45,
    space: 4,
  },
  documents: {
    label: "Docs",
    icon: FileText,
    color: "bg-amber-300/13 text-amber-100 border-amber-300/24",
    weight: 0.08,
    space: 1,
  },
  health: {
    label: "Health",
    icon: Heart,
    color: "bg-emerald-300/12 text-emerald-100 border-emerald-300/22",
    weight: 0.18,
    space: 2,
  },
  misc: {
    label: "Misc",
    icon: Package,
    color: "bg-white/8 text-white/70 border-white/12",
    weight: 0.3,
    space: 4,
  },
};

const NEVER_CHECK_CATEGORIES = new Set(["documents", "electronics", "health"]);

function cleanItemName(name: string) {
  return name
    .replace(/\s*\[[^\]]+\]$/, "")
    .replace(/\s*\(x\d+\)$/, "")
    .trim();
}

function defaultZone(item: PackingItem): BagZone {
  return NEVER_CHECK_CATEGORIES.has(item.category) ? "carry-on" : "checked";
}

function estimateWeight(items: PackingItem[]) {
  return items.reduce((sum, item) => {
    const meta = CATEGORY_META[item.category] ?? CATEGORY_META.misc;
    return sum + meta.weight;
  }, 0);
}

function estimateSpace(items: PackingItem[]) {
  return Math.min(
    100,
    Math.round(
      items.reduce((sum, item) => {
        const meta = CATEGORY_META[item.category] ?? CATEGORY_META.misc;
        return sum + meta.space;
      }, 0)
    )
  );
}

function PackItem({
  item,
  onTogglePacked,
}: {
  item: PackingItem;
  onTogglePacked: (item: PackingItem) => void;
}) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.misc;
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", item.id);
      }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5",
        meta.color,
        item.is_packed && "opacity-45"
      )}
    >
      <meta.icon className="size-3.5 shrink-0" />
      <span className={cn("min-w-0 flex-1 truncate", item.is_packed && "line-through")}>
        {cleanItemName(item.name)}
      </span>
      <button
        type="button"
        onClick={() => onTogglePacked(item)}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          item.is_packed
            ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
            : "border-white/20 bg-black/10 text-white/30 group-hover:text-white"
        )}
        aria-label={`Mark ${cleanItemName(item.name)} as packed`}
      >
        <Check className="size-3" />
      </button>
    </div>
  );
}

function Zone({
  title,
  icon: Icon,
  zone,
  items,
  onDropItem,
  onTogglePacked,
  accentGradient,
}: {
  title: string;
  icon: LucideIcon;
  zone: BagZone;
  items: PackingItem[];
  onDropItem: (itemId: string, zone: BagZone) => void;
  onTogglePacked: (item: PackingItem) => void;
  accentGradient?: string;
}) {
  const [isOver, setIsOver] = useState(false);
  const weight = estimateWeight(items);
  const space = estimateSpace(items);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const itemId = event.dataTransfer.getData("text/plain");
        if (itemId) onDropItem(itemId, zone);
      }}
      className={cn(
        "relative min-h-72 overflow-hidden rounded-[10px] border border-white/10 bg-black/18 p-4 transition-colors",
        isOver && "border-teal-300/60 bg-teal-300/10"
      )}
    >
      {accentGradient && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{ background: accentGradient }}
        />
      )}
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/8">
              <Icon className="size-4 text-white/70" />
            </div>
            <div>
              <p className="font-semibold text-white">{title}</p>
              <p className="text-xs text-white/35">{items.length} items</p>
            </div>
          </div>
          <p className="text-xs font-medium text-white/45">
            {weight.toFixed(1)} kg
          </p>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="signal-line h-full rounded-full"
            style={{ width: `${space}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-white/30">{space}% space estimate</p>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {items.length > 0 ? (
            items.map((item) => (
              <PackItem key={item.id} item={item} onTogglePacked={onTogglePacked} />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-white/12 p-6 text-center text-xs text-white/30">
              Drag items here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function VisualPackMode({
  items,
  onTogglePacked,
}: {
  items: PackingItem[];
  onTogglePacked: (item: PackingItem) => void;
}) {
  const [zones, setZones] = useState<Record<string, BagZone>>(() =>
    Object.fromEntries(items.map((item) => [item.id, defaultZone(item)]))
  );

  const categorized = useMemo(() => {
    const result = new Map<string, PackingItem[]>();
    for (const item of items) {
      const group = result.get(item.category) ?? [];
      group.push(item);
      result.set(item.category, group);
    }
    return result;
  }, [items]);

  const carryOnItems = items.filter(
    (item) => (zones[item.id] ?? defaultZone(item)) === "carry-on"
  );
  const checkedItems = items.filter(
    (item) => (zones[item.id] ?? defaultZone(item)) === "checked"
  );
  const packLast = items.filter((item) =>
    ["toiletries", "electronics", "documents", "health"].includes(item.category)
  );
  const neverCheck = items.filter((item) =>
    NEVER_CHECK_CATEGORIES.has(item.category)
  );

  const moveItem = (itemId: string, zone: BagZone) => {
    setZones((prev) => ({ ...prev, [itemId]: zone }));
  };

  return (
    <div className="space-y-5">
      <div className="command-panel p-5">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(99,102,241,0.08) 50%, rgba(139,92,246,0.12))",
          }}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Luggage className="size-5 text-teal-200" />
              <h2 className="text-lg font-black text-white">Visual Pack Mode</h2>
            </div>
            <p className="mt-1 text-sm text-white/45">
              Drag items between bags, check them off, and use the zones as a
              packing map.
            </p>
          </div>
          <div className="metric-tile px-4 py-2 text-right">
            <p className="text-xs text-white/35">Estimated total weight</p>
            <p className="text-lg font-bold text-white">
              {estimateWeight(items).toFixed(1)} kg
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(CATEGORY_META).map(([category, meta]) => {
            const categoryItems = categorized.get(category) ?? [];
            return (
              <div
                key={category}
                className={cn("rounded-lg border p-3", meta.color)}
              >
                <meta.icon className="size-4" />
                <p className="mt-2 text-xs font-semibold">{meta.label}</p>
                <p className="text-[11px] opacity-70">
                  {categoryItems.length} item{categoryItems.length === 1 ? "" : "s"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Zone
          title="Carry-on"
          icon={Briefcase}
          zone="carry-on"
          items={carryOnItems}
          onDropItem={moveItem}
          onTogglePacked={onTogglePacked}
          accentGradient="linear-gradient(135deg, rgba(45,212,191,0.3), transparent 60%)"
        />
        <Zone
          title="Checked bag"
          icon={Luggage}
          zone="checked"
          items={checkedItems}
          onDropItem={moveItem}
          onTogglePacked={onTogglePacked}
          accentGradient="linear-gradient(135deg, rgba(139,92,246,0.2), transparent 60%)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="command-panel p-4">
          <p className="font-semibold text-white">Pack last</p>
          <p className="mt-1 text-xs text-white/35">
            Keep these accessible until the final sweep.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packLast.slice(0, 10).map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
              >
                {cleanItemName(item.name)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] border border-amber-300/24 bg-amber-300/10 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-300" />
            <p className="font-semibold text-white">Do not check in</p>
          </div>
          <p className="mt-1 text-xs text-white/45">
            Documents, medication, chargers, and valuables stay with you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {neverCheck.slice(0, 10).map((item) => (
              <span
                key={item.id}
              className="rounded-full border border-amber-300/24 bg-black/10 px-3 py-1 text-xs text-amber-100/75"
              >
                {cleanItemName(item.name)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
