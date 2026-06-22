import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { HeroSearchBar, TypewriterBadge } from "@/components/landing/hero-interactive";
import { HeroMosaic } from "@/components/landing/hero-mosaic";
import { AtmosphericBackground } from "@/components/atmospheric-background";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="h-screen text-white">
      <AtmosphericBackground intense />
      <HeroMosaic />

      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            PackMind
          </Link>

          <div className="flex items-center gap-4">
            {userId ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{
          background: `linear-gradient(180deg,
            rgba(0,0,0,0.4) 0%,
            rgba(0,0,0,0.2) 15%,
            rgba(0,0,0,0.6) 40%,
            rgba(0,0,0,0.6) 60%,
            rgba(0,0,0,0.2) 85%,
            rgba(0,0,0,0.35) 100%
          )`
        }} />
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)"
        }} />
        <div className="relative mx-auto max-w-4xl">
          <TypewriterBadge />

          <h1 className="mt-6 text-6xl font-bold tracking-tight text-white md:text-8xl">
            Pack anything. Miss nothing.
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-xl text-white/60">
            AI builds your perfect packing list in seconds — personalized to
            your destination, weather, and travel style.
          </p>

          <HeroSearchBar />

          <p className="mt-6 text-sm text-white/40">
            Free forever &middot; No credit card &middot; 10k+ trips planned
          </p>
        </div>
      </section>
    </div>
  );
}
