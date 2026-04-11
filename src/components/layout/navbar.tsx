"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, Aperture, BarChart3, Dumbbell, LogOut, Settings, Video,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/recordings", label: "Recordings", icon: Video },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ─── Desktop ─── */}
      <header className="sticky top-0 z-50 hidden md:block bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="gradient-bar" />
        <nav className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Aperture className="h-6 w-6 text-purple-400 group-hover:rotate-90 transition-transform duration-500" strokeWidth={1.75} />
            <span className="text-lg font-bold tracking-tight">
              Lift<span className="text-purple-400">IQ</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-purple-500/10 text-purple-400"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              );
            })}
            <div className="w-px h-6 bg-zinc-800 mx-2" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Logout
            </button>
          </div>
        </nav>
      </header>

      {/* ─── Mobile ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/60 pb-[env(safe-area-inset-bottom)]">
        <div className="gradient-bar" />
        <div className="flex items-stretch justify-around h-16 px-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-purple-400" : "text-zinc-600"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
