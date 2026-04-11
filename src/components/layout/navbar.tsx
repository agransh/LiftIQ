"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, Dumbbell, LogOut, Settings, Video, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/workout", label: "Train", icon: Dumbbell },
  { href: "/recordings", label: "Library", icon: Video },
  { href: "/dashboard", label: "Stats", icon: BarChart3 },
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
      {/* ─── Desktop top bar ─── */}
      <header className="sticky top-0 z-50 hidden md:block">
        <div className="glass border-b border-white/[0.04]">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/20 transition-shadow group-hover:shadow-cyan-500/40">
                <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-extrabold tracking-tight">
                Lift<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">IQ</span>
              </span>
            </Link>

            <div className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all duration-200",
                      active
                        ? "text-cyan-300"
                        : "text-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.5} />
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                    )}
                  </Link>
                );
              })}
              <div className="mx-3 h-5 w-px bg-white/[0.06]" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:text-zinc-300"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ─── Mobile bottom nav ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="glass border-t border-white/[0.04] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-stretch justify-around h-16 px-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                    active ? "text-cyan-400" : "text-zinc-600"
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.5} />
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                  {active && (
                    <span className="absolute top-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
