import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Gift,
  LayoutDashboard,
  Leaf,
  LogOut,
  Trophy,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/children", label: "Children", icon: Users },
  { to: "/log", label: "Daily log", icon: CalendarCheck },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function EcoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft",
        className,
      )}
    >
      <Leaf className="size-5" />
    </span>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 z-20 border-b border-border bg-sidebar/95 backdrop-blur lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-4">
          <EcoMark />
          <div className="leading-tight">
            <p className="text-display text-lg font-semibold">EcoPoints</p>
            <p className="text-xs text-muted-foreground">Carpool rewards</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-3 pb-5 lg:mt-auto lg:block">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1">
        <header className="grain-surface border-b border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-8 sm:px-8">
            <div>
              <h1 className="text-display text-3xl font-semibold sm:text-4xl">{title}</h1>
              {subtitle ? (
                <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {action}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={signOut}
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
