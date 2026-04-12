"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, Dumbbell, LogOut, Settings, Video } from "lucide-react";
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
      {/* Reserve space so content is not covered by the fixed desktop header */}
      <div className="hidden md:block h-16 shrink-0" aria-hidden="true" />

      {/* Desktop: fixed bar — solid background so scroll does not show through */}
      <header className="fixed top-0 left-0 right-0 z-[100] hidden h-16 border-b border-border bg-background md:block">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <Image src="/logo.png" alt="LiftIQ" width={44} height={44} className="rounded-lg" />
            <span className="text-lg font-extrabold tracking-tight">
              Lift
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">IQ</span>
            </span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 sm:px-4",
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
            <div className="mx-2 hidden h-5 w-px bg-white/[0.06] sm:block" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:text-zinc-300"
              title="Logout"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile: bottom tab bar — solid background */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background md:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="flex h-16 items-stretch justify-around px-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                  active ? "text-cyan-400" : "text-zinc-600 active:text-zinc-300"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.5} />
                <span className="truncate text-[10px] font-medium tracking-wide">{item.label}</span>
                {active && (
                  <span className="absolute top-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
