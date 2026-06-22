import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Boxes, LayoutDashboard, PlaneTakeoff } from "lucide-react";
import { AtmosphericBackground } from "@/components/atmospheric-background";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips/new", label: "Trips", icon: PlaneTakeoff },
  { href: "/templates", label: "Templates", icon: Boxes },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col text-white">
      <AtmosphericBackground />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05080c]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 text-xl font-black tracking-tight text-white"
            >
              <span className="flex size-9 items-center justify-center rounded-lg border border-teal-300/25 bg-teal-300/10 text-sm text-teal-200 shadow-[0_0_24px_rgba(45,212,191,0.16)]">
                PM
              </span>
              PackMind
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/58 transition-colors hover:bg-white/8 hover:text-white"
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
                );
              })}
            </nav>
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
