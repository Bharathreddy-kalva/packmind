"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  Briefcase,
  Building,
  Heart,
  Loader2,
  Mountain,
  Palmtree,
  Snowflake,
  Sparkles,
  Tent,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Trip Details", "Trip Type", "Activities", "Preferences"];

const TRIP_TYPES = [
  { value: "beach", label: "Beach", icon: Palmtree },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "hiking", label: "Hiking", icon: Mountain },
  { value: "city", label: "City", icon: Building },
  { value: "camping", label: "Camping", icon: Tent },
  { value: "ski", label: "Ski", icon: Snowflake },
  { value: "wedding", label: "Wedding", icon: Heart },
  { value: "backpacking", label: "Backpacking", icon: Backpack },
];

const ACTIVITIES = [
  "Swimming",
  "Hiking",
  "Fine Dining",
  "Nightlife",
  "Museums",
  "Shopping",
  "Snorkeling",
  "Photography",
  "Gym",
  "Spa",
  "Adventure Sports",
  "Beach",
];

const TRAVEL_STYLES = [
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Pack light — only the essentials.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "A healthy mix of essentials and extras.",
  },
  {
    value: "prepared",
    label: "Prepared",
    description: "Ready for anything — pack it all.",
  },
];

const REMINDER_OPTIONS = [
  { key: "threeDaysBefore", label: "3 days before" },
  { key: "oneDayBefore", label: "1 day before" },
  { key: "morningOf", label: "Morning of" },
] as const;

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none";

function NewTripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [tripType, setTripType] = useState(() => searchParams.get("type") ?? "");
  const [activities, setActivities] = useState<string[]>(() => {
    const raw = searchParams.get("activities");
    return raw ? raw.split(",").filter(Boolean) : [];
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reminders, setReminders] = useState({
    threeDaysBefore: true,
    oneDayBefore: true,
    morningOf: false,
  });
  const [travelStyle, setTravelStyle] = useState("balanced");

  const toggleActivity = (activity: string) => {
    setActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  const canGoNext = () => {
    if (step === 0) {
      return (
        destination.trim() !== "" &&
        departureDate !== "" &&
        returnDate !== "" &&
        returnDate >= departureDate
      );
    }
    if (step === 1) {
      return tripType !== "";
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          departure_date: departureDate,
          return_date: returnDate,
          trip_type: tripType,
          activities,
          phone_number: phoneNumber,
          travel_style: travelStyle,
          reminders,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to create trip.");
        setIsSubmitting(false);
        return;
      }

      const { id } = data;
      router.push(`/trips/${id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-center">
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-slate-400">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                Where are you headed?
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Tell us about your trip.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tokyo, Japan"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Departure date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className={cn(inputClass, "[color-scheme:dark]")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Return date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate || undefined}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={cn(inputClass, "[color-scheme:dark]")}
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                What kind of trip is this?
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Pick the option that fits best.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TRIP_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTripType(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                    tripType === value
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-white"
                  )}
                >
                  <Icon className="size-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                What will you be doing?
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Select all that apply.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleActivity(activity)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    activities.includes(activity)
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-white"
                  )}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white">Almost done</h2>
              <p className="mt-1 text-sm text-slate-400">
                Set up reminders and tell us your packing style.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Phone number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-500">
                We&apos;ll use this for SMS packing reminders.
              </p>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-300">
                Remind me
              </span>
              <div className="mt-2 space-y-2">
                {REMINDER_OPTIONS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={reminders[key]}
                      onChange={(e) =>
                        setReminders((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="size-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-300">
                Travel style
              </span>
              <div className="mt-2 space-y-2">
                {TRAVEL_STYLES.map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                      travelStyle === value
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    )}
                  >
                    <input
                      type="radio"
                      name="travelStyle"
                      value={value}
                      checked={travelStyle === value}
                      onChange={() => setTravelStyle(value)}
                      className="mt-1 size-4 border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-white">
                        {label}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || isSubmitting}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white",
            step === 0 && "pointer-events-none opacity-0"
          )}
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canGoNext()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generate My Packing List
          </button>
        )}
      </div>
    </div>
  );
}

export default function NewTripPage() {
  return (
    <Suspense fallback={null}>
      <NewTripForm />
    </Suspense>
  );
}
