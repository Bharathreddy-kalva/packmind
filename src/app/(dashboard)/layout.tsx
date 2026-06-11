import Link from "next/link";
import { Luggage } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

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
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <Luggage className="size-5 text-indigo-500" />
              <span>PackMind</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
