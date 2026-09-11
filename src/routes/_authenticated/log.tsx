import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BatteryCharging, CalendarCheck, Check, Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCarpoolChildren, usePickupLogs, useProfile } from "@/hooks/use-ecopoints";
import {
  EV_DAILY_BONUS,
  FAR_BONUS,
  LOG_ERRORS,
  MIN_CHILDREN,
  POINTS_PER_CHILD,
  formatPoints,
  todayISO,
} from "@/lib/ecopoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({
    meta: [
      { title: "Daily log — EcoPoints" },
      {
        name: "description",
        content: "Record which classmates you carpooled today and bank your EcoPoints for the day.",
      },
      { property: "og:title", content: "Daily log — EcoPoints" },
      { property: "og:description", content: "Record today's school run and bank your points." },
    ],
  }),
  component: LogPage,
});

function LogPage() {
  const queryClient = useQueryClient();
  const { data: children = [], isLoading } = useCarpoolChildren();
  const { data: profile } = useProfile();
  const { data: logs = [] } = usePickupLogs();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const today = todayISO();
  const approved = children.filter((c) => c.status === "approved");
  const seats = profile?.vehicle_seats ?? 4;
  const loggedToday = logs.filter((l) => l.log_date === today);
  const alreadyLogged = loggedToday.length > 0;

  const preview = useMemo(() => {
    const picked = approved.filter((c) => selected.includes(c.id));
    const base = picked.length * POINTS_PER_CHILD;
    const far = picked.filter((c) => c.is_far).length * FAR_BONUS;
    const ev = profile?.is_ev && picked.length >= MIN_CHILDREN ? EV_DAILY_BONUS : 0;
    const total = picked.length >= MIN_CHILDREN ? base + far + ev : 0;
    return { base, far, ev, total, count: picked.length };
  }, [approved, selected, profile?.is_ev]);

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= seats ? s : [...s, id],
    );
  }

  async function submit() {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("log_pickups", {
        p_date: today,
        p_child_ids: selected,
      });
      if (error) throw error;
      const result = data as { ok?: boolean; error?: string; points?: number } | null;
      if (!result?.ok) {
        toast.error(LOG_ERRORS[result?.error ?? ""] ?? "Could not record that run.");
        return;
      }
      toast.success(`${formatPoints(result.points ?? 0)} points added for today.`);
      setSelected([]);
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record that run.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Today's run"
      subtitle={`Tick the classmates you dropped home today. Minimum ${MIN_CHILDREN}, up to ${seats} seats.`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section>
          {isLoading ? (
            <Skeleton className="h-40 rounded-3xl" />
          ) : approved.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No approved children yet — points start once a classmate's parent confirms.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/children">Add a child</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {approved.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left shadow-soft transition-colors",
                        on ? "border-primary/50 bg-secondary" : "border-border bg-card hover:bg-accent",
                      )}
                    >
                      <Checkbox checked={on} className="pointer-events-none" tabIndex={-1} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{c.child_name}</p>
                        <p className="truncate text-sm text-muted-foreground">{c.drop_address}</p>
                      </div>
                      <span className="text-display shrink-0 text-sm font-semibold tabular-nums">
                        +{formatPoints(POINTS_PER_CHILD + (c.is_far ? FAR_BONUS : 0))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-lift lg:sticky lg:top-6">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <CalendarCheck className="size-3.5" />
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <p className="text-display mt-3 text-3xl font-semibold tabular-nums">
            {formatPoints(preview.total)} pts
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <Row label={`${preview.count} × pickup`} value={preview.base} />
            <Row label="Far-drop bonus" value={preview.far} />
            {profile?.is_ev ? <Row label="EV daily bonus" value={preview.ev} /> : null}
          </ul>
          {preview.count > 0 && preview.count < MIN_CHILDREN ? (
            <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              Pick at least {MIN_CHILDREN} children for the day to count.
            </p>
          ) : null}
          {profile?.is_ev ? (
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <BatteryCharging className="mt-0.5 size-3.5 shrink-0 text-leaf" />
              Your EV adds {formatPoints(EV_DAILY_BONUS)} points on every qualifying day.
            </p>
          ) : null}
          <Button
            className="mt-5 w-full gap-2"
            onClick={submit}
            disabled={busy || preview.count < MIN_CHILDREN}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {alreadyLogged ? "Update today's run" : "Record today's run"}
          </Button>
          {alreadyLogged ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Already logged today:{" "}
              {formatPoints(loggedToday.reduce((s, l) => s + l.points, 0))} pts
            </p>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-foreground tabular-nums">+{formatPoints(value)}</span>
    </li>
  );
}
