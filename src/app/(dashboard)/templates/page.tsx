import Link from "next/link";
import { cn } from "@/lib/utils";
import { tripGradient, TRIP_TYPE_ICONS } from "@/lib/trip-style";

const TEMPLATES: {
  name: string;
  tripType: string;
  itemCount: number;
  categories: string[];
  activities: string[];
}[] = [
  {
    name: "Beach Week",
    tripType: "beach",
    itemCount: 28,
    categories: ["Clothing", "Toiletries", "Electronics"],
    activities: ["Swimming", "Beach", "Snorkeling"],
  },
  {
    name: "Business Trip",
    tripType: "business",
    itemCount: 18,
    categories: ["Clothing", "Electronics", "Documents"],
    activities: ["Fine Dining"],
  },
  {
    name: "Mountain Hiking",
    tripType: "hiking",
    itemCount: 25,
    categories: ["Clothing", "Health", "Misc"],
    activities: ["Hiking", "Photography", "Adventure Sports"],
  },
  {
    name: "City Break",
    tripType: "city",
    itemCount: 20,
    categories: ["Clothing", "Electronics", "Documents"],
    activities: ["Museums", "Shopping", "Nightlife"],
  },
  {
    name: "Ski Trip",
    tripType: "ski",
    itemCount: 27,
    categories: ["Clothing", "Health", "Misc"],
    activities: ["Adventure Sports", "Photography"],
  },
  {
    name: "Backpacking",
    tripType: "backpacking",
    itemCount: 30,
    categories: ["Clothing", "Health", "Misc"],
    activities: ["Hiking", "Adventure Sports", "Photography"],
  },
  {
    name: "Wedding Guest",
    tripType: "wedding",
    itemCount: 15,
    categories: ["Clothing", "Toiletries", "Documents"],
    activities: ["Fine Dining"],
  },
  {
    name: "Camping",
    tripType: "camping",
    itemCount: 24,
    categories: ["Clothing", "Health", "Misc"],
    activities: ["Hiking", "Adventure Sports"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Trip <span className="text-gradient">Templates</span>
        </h1>
        <p className="mt-2 text-slate-400">
          Start from a pre-built packing list and customize it for your trip.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((template, index) => {
          const Icon = TRIP_TYPE_ICONS[template.tripType];
          const gradient = tripGradient(template.tripType);
          const params = new URLSearchParams({
            type: template.tripType,
            activities: template.activities.join(","),
          });

          return (
            <div
              key={template.name}
              style={{ animationDelay: `${index * 50}ms` }}
              className="card-glow animate-fade-in-up flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div
                className={cn(
                  "flex h-20 items-center justify-center bg-gradient-to-br",
                  gradient
                )}
              >
                <Icon className="size-8 text-white" />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-white">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {template.itemCount} items
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {template.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/trips/new?${params.toString()}`}
                  className="mt-5 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Use Template
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
