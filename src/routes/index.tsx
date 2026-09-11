import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BatteryCharging, Car, Clock, Leaf, Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EcoMark } from "@/components/app-shell";
import { MILESTONES, formatPoints } from "@/lib/ecopoints";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoPoints — Carpool rewards for school parents" },
      {
        name: "description",
        content:
          "Fewer cars at the gate, more points for you. Parents earn EcoPoints for every classmate they carpool, and unlock school rewards.",
      },
      { property: "og:title", content: "EcoPoints — Carpool rewards for school parents" },
      {
        property: "og:description",
        content:
          "Fewer cars at the gate, more points for you. Earn EcoPoints for every classmate you carpool.",
      },
    ],
  }),
  component: Landing,
});

const STATS = [
  { icon: Users, label: "1,000 points", note: "for every classmate you drop home" },
  { icon: Car, label: "+2,000 points", note: "when their home is over 10 km away" },
  { icon: BatteryCharging, label: "+2,000 daily", note: "if you drive an electric vehicle" },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <EcoMark />
          <div className="leading-tight">
            <p className="text-display text-lg font-semibold">EcoPoints</p>
            <p className="text-xs text-muted-foreground">School carpool rewards</p>
          </div>
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="grain-surface border-y border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
              <Leaf className="size-3.5" />
              Arrival &amp; dispersal, calmed
            </span>
            <h1 className="text-display mt-6 text-4xl leading-[1.05] font-semibold sm:text-6xl">
              Fewer cars at the gate.
              <br />
              <span className="text-primary">More points for you.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              The school rush happens because every child arrives in a separate car. EcoPoints
              rewards the parents who fix it — pick up a classmate or two on your way, earn points
              every single day, and climb towards real school rewards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  Create your account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">I already have one</Link>
              </Button>
            </div>
            <dl className="mt-12 grid gap-5 sm:grid-cols-3">
              {STATS.map(({ icon: Icon, label, note }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <Icon className="size-5 text-leaf" />
                  <dt className="text-display mt-3 text-lg font-semibold">{label}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{note}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Trophy className="size-4 text-clay" />
              Milestones
            </div>
            <ul className="mt-5 space-y-4">
              {MILESTONES.map((m, i) => (
                <li key={m.tier} className="flex gap-4">
                  <span className="text-display grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {m.tier}
                      <span className="ml-2 text-xs font-medium text-muted-foreground tabular-nums">
                        {formatPoints(m.points)} pts
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{m.reward}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
              <Clock className="mt-0.5 size-4 shrink-0 text-clay" />
              <p>
                Every extra child needs their own parent's permission code, valid for 24 hours,
                before a single point is counted.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted-foreground sm:px-8">
        EcoPoints · a calmer school gate, one shared ride at a time.
      </footer>
    </div>
  );
}
