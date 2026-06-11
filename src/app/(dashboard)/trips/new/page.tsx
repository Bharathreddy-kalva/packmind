"use client";

import { useState } from "react";
import { ClipboardList, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import NewTripForm from "./new-trip-form";
import { TripChat } from "./trip-chat";

type Mode = "form" | "chat";

const MODES: { key: Mode; label: string; icon: typeof MessageCircle }[] = [
  { key: "form", label: "Form", icon: ClipboardList },
  { key: "chat", label: "Chat with AI", icon: MessageCircle },
];

export default function NewTripPage() {
  const [mode, setMode] = useState<Mode>("chat");

  return (
    <div className="animate-fade-in-up mx-auto flex max-w-2xl flex-col py-6">
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 p-1">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                mode === key
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "chat" ? <TripChat /> : <NewTripForm />}
    </div>
  );
}
