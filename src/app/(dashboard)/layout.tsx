import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { AtmosphericBackground } from "@/components/atmospheric-background";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips/new", label: "Trips" },
  { href: "/templates", label: "Templates" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col text-white">
      <AtmosphericBackground />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/10 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight text-white"
            >
              PackMind
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
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
