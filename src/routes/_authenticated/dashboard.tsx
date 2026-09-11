import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { BatteryCharging, CalendarCheck, Flame, Leaf, TrendingUp, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PointsRing } from "@/components/points-ring";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCarpoolChildren,
  usePickupLogs,
  useProfile,
} from "@/hooks/use-ecopoints";
import {
  co2SavedKg,
  currentTier,
  formatPoints,
  milestoneProgress,
  nextMilestone,
  todayISO,
} from "@/lib/ecopoints";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EcoPoints" },
      {
        name: "description",
        content: "Track your EcoPoints balance, today's carpool run and progress to the next milestone.",
      },
      { property: "og:title", content: "Dashboard — EcoPoints" },
      { property: "og:description", content: "Your carpool points, streak and milestone progress." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: logs = [], isLoading: loadingLogs } = usePickupLogs();
  const { data: children = [] } = useCarpoolChildren();

  useEffect(() => {
    if (!loadingProfile && (!profile || !profile.onboarded)) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loadingProfile, profile, navigate]);

  const stats = useMemo(() => {
    const total = logs.reduce((s, l) => s + l.points, 0);
    const today = todayISO();
    const todayPoints = logs.filter((l) => l.log_date === today).reduce((s, l) => s + l.points, 0);
    const pickups = logs.filter((l) => l.kind === "pickup").length;
    const dates = [...new Set(logs.map((l) => l.log_date))].sort().reverse();
    let streak = 0;
    const cursor = new Date(`${today}T00:00:00`);
    for (;;) {
      const iso = cursor.toISOString().slice(0, 10);
      if (dates.includes(iso)) {
        streak += 1;
      } else if (streak > 0 || iso !== today) {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
      if (streak > 365) break;
    }
    return { total, todayPoints, pickups, streak, daysLogged: dates.length };
  }, [logs]);

  const tier = currentTier(stats.total);
  const next = nextMilestone(stats.total);
  const approved = children.filter((c) => c.status === "approved").length;
  const pending = children.filter((c) => c.status === "pending").length;
  const loading = loadingProfile || loadingLogs;

  return (
    <AppShell
      title={profile?.full_name ? `Good day, ${profile.full_name.split(" ")[0]}` : "Your dashboard"}
      subtitle="Every shared ride is one less car at the gate — and points in your basket."
      action={
        <Button asChild size="sm">
          <Link to="/log">Log today's run</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <Skeleton className="size-[232px] rounded-full" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-8 rounded-3xl border border-border bg-card p-7 shadow-lift lg:grid-cols-[auto_1fr] lg:items-center">
            <PointsRing
              points={stats.total}
              progress={milestoneProgress(stats.total)}
              caption="Total EcoPoints"
            />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {tier ? `Current tier · ${tier.tier}` : "Getting started"}
              </p>
              <h2 className="text-display mt-1 text-2xl font-semibold">
                {next
                  ? `${formatPoints(next.points - stats.total)} points to ${next.tier}`
                  : "You've reached the highest tier"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {next ? next.reward : "Forest Champion — the top of the carpool board."}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Mini icon={CalendarCheck} label="Today" value={`${formatPoints(stats.todayPoints)} pts`} />
                <Mini icon={Flame} label="Streak" value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`} />
                <Mini icon={Leaf} label="CO₂ saved" value={`${co2SavedKg(stats.pickups)} kg`} />
              </div>
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label="Approved children" value={String(approved)} note="ready to be logged" />
            <Stat icon={CalendarCheck} label="Pending permissions" value={String(pending)} note="waiting for a code" />
            <Stat icon={TrendingUp} label="Days logged" value={String(stats.daysLogged)} note="school runs recorded" />
            <Stat
              icon={BatteryCharging}
              label="Vehicle"
              value={profile?.is_ev ? "Electric" : "Petrol / diesel"}
              note={profile ? `${profile.vehicle_seats} seats · ${profile.vehicle_number}` : ""}
            />
          </section>

          {pending > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary p-6">
              <div>
                <p className="text-display text-lg font-semibold text-secondary-foreground">
                  {pending} child{pending === 1 ? "" : "ren"} still need a permission code
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Their parent's 6-digit code unlocks points for that child.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/children">Enter a code</Link>
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="text-display mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <Icon className="size-5 text-leaf" />
      <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-display mt-1 text-xl font-semibold">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
