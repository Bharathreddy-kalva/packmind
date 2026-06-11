"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

const DESTINATIONS = ["Pack for Bali", "Pack for Tokyo", "Pack for Paris"];

export function TypewriterBadge() {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = DESTINATIONS[phraseIndex];
    let delay = isDeleting ? 40 : 80;

    if (!isDeleting && text === phrase) {
      delay = 1500;
    } else if (isDeleting && text === "") {
      delay = 300;
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (text === phrase) {
          setIsDeleting(true);
        } else {
          setText(phrase.slice(0, text.length + 1));
        }
      } else {
        if (text === "") {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % DESTINATIONS.length);
        } else {
          setText(text.slice(0, -1));
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex]);

  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/70">
      <Sparkles className="size-3.5 text-indigo-400" />
      <span className="min-w-[9.5rem] text-left">{text}</span>
      <span className="h-4 w-px animate-pulse bg-white/40" />
    </div>
  );
}

export function HeroSearchBar() {
  const router = useRouter();
  const [destination, setDestination] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/trips/new");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white/10 p-2 pl-6 backdrop-blur-md"
    >
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Where are you going?"
        className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
      />
      <button
        type="submit"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
      >
        Pack Now
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
