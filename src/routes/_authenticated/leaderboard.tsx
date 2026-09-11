import { createFileRoute } from "@tanstack/react-router";
import { BatteryCharging, Crown, Trophy } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard, useSession } from "@/hooks/use-ecopoints";
import { currentTier, formatPoints } from "@/lib/ecopoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — EcoPoints" },
      {
        name: "description",
        content: "See which parents are carpooling the most children and topping the EcoPoints board.",
      },
      { property: "og:title", content: "Leaderboard — EcoPoints" },
      { property: "og:description", content: "The school's top carpooling parents, ranked." },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const { data: rows = [], isLoading } = useLeaderboard();
  const { user } = useSession();

  return (
    <AppShell title="Leaderboard" subtitle="Every parent at the school, ranked by EcoPoints earned.">
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No points recorded yet. Be the first family on the board.
        </p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, i) => {
            const me = row.parent_id === user?.id;
            const tier = currentTier(Number(row.total_points));
            return (
              <li
                key={row.parent_id}
                className={cn(
                  "flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-soft",
                  me ? "border-primary/50 bg-secondary" : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "text-display grid size-11 shrink-0 place-items-center rounded-xl text-base font-semibold",
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i === 0 ? <Crown className="size-5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {row.full_name?.trim() || "A parent"}
                    {me ? <span className="ml-2 text-xs text-primary">You</span> : null}
                    {row.is_ev ? (
                      <BatteryCharging className="ml-2 inline size-3.5 text-leaf" aria-label="Electric vehicle" />
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tier ? `${tier.tier} · ` : ""}
                    {row.children_helped} child{Number(row.children_helped) === 1 ? "" : "ren"} carpooled
                  </p>
                </div>
                <p className="text-display text-lg font-semibold tabular-nums">
                  {formatPoints(Number(row.total_points))}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">pts</span>
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-3xl bg-secondary p-5 text-sm text-secondary-foreground">
        <Trophy className="mt-0.5 size-4 shrink-0 text-clay" />
        <p>
          Rankings update the moment a daily run is logged. Only approved children count, and points
          are capped by the number of seats in your vehicle.
        </p>
      </div>
    </AppShell>
  );
}
