# EcoPoints — School Carpool Rewards Dashboard

A polished, light-mode dashboard where parents of an Indian school earn points for carpooling other children, reducing the rush at arrival and dispersal.

## What parents experience

1. **Sign up** with email and password.
2. **Onboarding** (one guided multi-step flow): parent name, phone, home address, distance from school, vehicle number, vehicle seats, whether it is an EV, arrival time they can reach school by, and their own ward's name + scholar number (they can add more than one of their own children).
3. **Dashboard home**: a large circular progress meter showing total points, the next milestone and points remaining, today's earnings breakdown, plus streak and CO2-saved style stats.
4. **Plus button → Add a child**: name, scholar number, parent's name, drop address, "address is more than 10 km away" checkbox, and "I have parental permission" checkbox.
   - Submitting creates a **pending request** with a 6-digit code valid 24 hours. The code-entry screen and the pending state are built now; actual code delivery (SMS/email) is left for later, so a request simply waits until the code is entered.
   - Entering the correct, unexpired code approves the child; expired requests show as expired with a "regenerate" action.
   - **Pending applications tab** lists everything waiting, with the time left on each code.
5. **Daily log**: parent marks which approved children they picked up that day (minimum 2 required for any pickup points to count). Number of extra children per day is capped by the vehicle's seat count from onboarding.
6. **Rewards page**: milestones, which are unlocked, and what's next.
7. **Leaderboard**: all parents ranked by points, names shown, current parent highlighted.

## Points rules

- 1,000 points per child picked up per day.
- 2,000 extra for a child whose drop address is more than 10 km from school.
- 2,000 passive points per day for EV vehicles.
- Pickup points only count when the parent logs at least 2 children that day.
- Extra children per day cannot exceed vehicle seats.

## Milestones and rewards

| Points | Tier | Reward |
| --- | --- | --- |
| 10,000 | Sapling | Digital eco-badge + name on school noticeboard |
| 25,000 | Sprout | Priority parking slot for a month |
| 50,000 | Grove Keeper | School-planted tree with the child's name |
| 100,000 | Canopy Guardian | Certificate at school assembly + reserved pickup lane |
| 200,000 | Forest Champion | Annual Green Family award and feature in school newsletter |

## Look and feel

Light mode only. Earth green and earth brown palette (deep forest green, moss, clay brown, warm sand backgrounds), a warm serif for headings paired with a clean sans for body, soft organic cards, leaf/route motifs, and subtle animated progress and count-up numbers. Not a stock React dashboard — layered, warm, and considered.

## Technical notes

- Lovable Cloud (Supabase) for auth and data. Email/password sign-in enabled.
- Tables: `profiles` (parent + vehicle + EV + arrival time), `wards` (own children), `carpool_children` (added children, status pending/approved/expired, far_distance flag, permission flag, otp code + expiry), `pickup_logs` (date, child, points awarded), and a points view/aggregate for the leaderboard. RLS scopes every row to the owning parent; the leaderboard reads a narrow public-safe projection of name + total points.
- Point calculation lives server-side so totals can't be edited from the browser.
- Routes: `/` (landing + sign in), `/onboarding`, and a protected app area with dashboard, children, pending, rewards, leaderboard.
- Code delivery is intentionally not wired to any SMS/email provider yet; codes are stored and validated so a provider can be plugged in later.

## Out of scope for now

- Actual OTP sending.
- School admin approval view.
