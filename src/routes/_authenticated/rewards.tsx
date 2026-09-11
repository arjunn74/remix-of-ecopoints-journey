import { createFileRoute } from "@tanstack/react-router";
import { Check, Gift, Lock } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { usePickupLogs } from "@/hooks/use-ecopoints";
import { MILESTONES, currentTier, formatPoints, milestoneProgress, nextMilestone } from "@/lib/ecopoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — EcoPoints" },
      {
        name: "description",
        content: "See every EcoPoints milestone, the school reward it unlocks and how close you are.",
      },
      { property: "og:title", content: "Rewards — EcoPoints" },
      { property: "og:description", content: "Milestones and school rewards for carpooling parents." },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  const { data: logs = [] } = usePickupLogs();
  const total = logs.reduce((s, l) => s + l.points, 0);
  const tier = currentTier(total);
  const next = nextMilestone(total);

  return (
    <AppShell
      title="Rewards"
      subtitle="Points turn into real recognition at school — here's the ladder."
    >
      <div className="rounded-3xl border border-border bg-card p-7 shadow-lift">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Your balance
            </p>
            <p className="text-display mt-1 text-3xl font-semibold tabular-nums">
              {formatPoints(total)} pts
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tier ? `${tier.tier} tier unlocked` : "No tier unlocked yet"}
            </p>
          </div>
          {next ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatPoints(next.points - total)}
              </span>{" "}
              to {next.tier}
            </p>
          ) : null}
        </div>
        <Progress value={milestoneProgress(total)} className="mt-5" />
      </div>

      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {MILESTONES.map((m) => {
          const unlocked = total >= m.points;
          return (
            <li
              key={m.tier}
              className={cn(
                "rounded-3xl border p-6 shadow-soft transition-colors",
                unlocked ? "border-primary/40 bg-secondary" : "border-border bg-card",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-display text-xl font-semibold">{m.tier}</p>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground tabular-nums">
                    {formatPoints(m.points)} points
                  </p>
                </div>
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl",
                    unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {unlocked ? <Check className="size-4" /> : <Lock className="size-4" />}
                </span>
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm">
                <Gift className="mt-0.5 size-4 shrink-0 text-clay" />
                <span className="font-medium">{m.reward}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{m.blurb}</p>
              {!unlocked ? (
                <Progress
                  value={Math.min(100, (total / m.points) * 100)}
                  className="mt-4"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
