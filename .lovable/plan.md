# EcoPoints: polish, demo data, and full end-to-end check

## 1. No email verification
New accounts sign in immediately after sign-up — no confirmation link, no "check your email" screen. The sign-up page goes straight to onboarding.

## 2. Faster pages
- Shared data (your profile, children, logs, leaderboard) is fetched once and reused across pages instead of refetched on every visit.
- Moving between pages starts loading data as the page opens, so screens fill in instantly instead of flashing empty skeletons.
- Leaderboard and rewards pages stop re-running their queries on every window focus.

## 3. A populated leaderboard
Add around 20 realistic demo families with names, points and children-carpooled counts, mixed EV and non-EV. They are clearly demo data, stored separately from real parents, and only ever appear on the leaderboard — never in your children, logs or rewards. Your own row still shows and is highlighted in the ranking.

## 4. Test account
Create a ready-to-use account, already onboarded, with a ward, two approved carpool children and a week of logged pickups so every page has content:
- email: `test@ecopoints.app`
- password: `ecopoints123`

## 5. Rethought milestones and rewards
A typical parent earns roughly 2,000–5,000 points a day, so the first tiers land within days:

| Points | Tier | Reward |
| --- | --- | --- |
| 3,000 | First Ride | Welcome badge on your profile |
| 8,000 | Seedling | Name on the school's Green Board that week |
| 20,000 | Sapling | A sapling planted on campus in your ward's name |
| 45,000 | Grove Keeper | Reserved priority parking slot for a month |
| 90,000 | Canopy Guardian | Certificate at morning assembly + reserved pickup lane |
| 175,000 | Green Family of the Year | Family award + feature in the school newsletter |

## 6. Input rules
- Scholar number: exactly 5 digits (numeric keypad, blocks anything else) — applied to both your ward and added children.
- Child and parent names: letters and spaces only.
- Phone: exactly 10 digits.
Each shows a clear inline message when wrong, and the form can't be submitted until it's valid.

## 7. Full end-to-end verification
Walk the whole app in a real browser as the test account and fix anything broken: sign-up, onboarding, dashboard, adding a child, entering the 6-digit code, pending tab, code regeneration, daily log (2-child minimum, seat cap, EV bonus), rewards and leaderboard. Check the build and the browser console are clean.

## Technical notes
- Turn on email auth with auto-confirm; drop the `emailRedirectTo` / confirmation UI branch in `src/routes/auth.tsx`.
- Query client defaults: `staleTime` ~60s, disable `refetchOnWindowFocus`; add route loaders using `ensureQueryData` for authenticated pages.
- New `demo_leaderboard` table (name, points, children_helped, is_ev) seeded by migration INSERTs; `get_leaderboard()` becomes a UNION of real profiles and demo rows, keeping the existing return shape so no client change is needed. RLS: no direct anon/authenticated read needed since the function is security definer.
- Test user created via the Auth Admin API, then profile/wards/carpool_children/pickup_logs rows inserted for it.
- Milestone table rewritten in `src/lib/ecopoints.ts`; progress helpers unchanged.
- Validation with zod schemas in `onboarding.tsx` and the add-child dialog in `children.tsx`.
