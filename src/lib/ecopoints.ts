export const POINTS_PER_CHILD = 1000;
export const FAR_BONUS = 2000;
export const EV_DAILY_BONUS = 2000;
export const MIN_CHILDREN = 2;

export type Milestone = {
  points: number;
  tier: string;
  reward: string;
  blurb: string;
};

export const MILESTONES: Milestone[] = [
  {
    points: 3000,
    tier: "First Ride",
    reward: "Welcome badge on your parent profile",
    blurb: "Your very first shared school run.",
  },
  {
    points: 8000,
    tier: "Seedling",
    reward: "Your family's name on the school Green Board that week",
    blurb: "A few quieter mornings already add up.",
  },
  {
    points: 20000,
    tier: "Sapling",
    reward: "A sapling planted on campus in your ward's name",
    blurb: "Something that keeps growing after drop-off.",
  },
  {
    points: 45000,
    tier: "Grove Keeper",
    reward: "Reserved priority parking slot for a month",
    blurb: "Skip the queue you helped shorten.",
  },
  {
    points: 90000,
    tier: "Canopy Guardian",
    reward: "Certificate at morning assembly + reserved pickup lane",
    blurb: "Recognised in front of the whole school.",
  },
  {
    points: 175000,
    tier: "Green Family of the Year",
    reward: "Family award + feature in the school newsletter",
    blurb: "The highest honour on the carpool board.",
  },
];

export function currentTier(points: number): Milestone | null {
  let tier: Milestone | null = null;
  for (const m of MILESTONES) if (points >= m.points) tier = m;
  return tier;
}

export function nextMilestone(points: number): Milestone | null {
  return MILESTONES.find((m) => points < m.points) ?? null;
}

export function milestoneProgress(points: number): number {
  const next = nextMilestone(points);
  if (!next) return 100;
  const prev = currentTier(points)?.points ?? 0;
  return Math.max(0, Math.min(100, ((points - prev) / (next.points - prev)) * 100));
}

export function formatPoints(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

/** Rough CO2 saved: one avoided car trip per extra child, ~2.4 kg per school run. */
export function co2SavedKg(childPickups: number): number {
  return Math.round(childPickups * 2.4 * 10) / 10;
}

export function otpTimeLeft(expiresAt: string): { expired: boolean; label: string } {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { expired: true, label: "Code expired" };
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return {
    expired: false,
    label: hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`,
  };
}

export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export const LOG_ERRORS: Record<string, string> = {
  no_profile: "Finish onboarding before recording pickups.",
  bad_date: "You can only record pickups for the last 7 days.",
  not_approved: "One of those children isn't approved yet.",
  min_two: "You need at least 2 children to earn pickup points.",
  over_seats: "That's more children than your vehicle has seats for.",
};
