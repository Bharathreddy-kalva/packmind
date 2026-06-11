"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING = "Hi! I'm your PackMind AI. Where are you heading? ✈️";

function Avatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
      PM
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export function TripChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tripCreated, setTripCreated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!tripCreated || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#a855f7", "#22d3ee"],
    });
  }, [tripCreated]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || tripCreated) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message as string },
      ]);

      if (data.tripCreated) {
        setTripCreated(true);
        setTimeout(() => {
          router.push(`/trips/${data.tripId}`);
        }, 1500);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong on my end. Could you try that again?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[65vh] min-h-[28rem] flex-col rounded-2xl border border-slate-800 bg-slate-950">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-end gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && <Avatar />}
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                message.role === "user"
                  ? "rounded-br-sm bg-indigo-500 text-white"
                  : "rounded-bl-sm bg-slate-800 text-slate-100"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-3">
            <Avatar />
            <TypingIndicator />
          </div>
        )}

        {tripCreated && (
          <div className="animate-fade-in-up flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <CheckCircle2 className="size-10 text-emerald-400" />
            <p className="font-semibold text-white">Trip created!</p>
            <p className="text-sm text-slate-400">
              Taking you to your packing list...
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-3 border-t border-slate-800 p-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading || tripCreated}
          autoFocus
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || tripCreated || !input.trim()}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </button>
      </form>
    </div>
  );
}
