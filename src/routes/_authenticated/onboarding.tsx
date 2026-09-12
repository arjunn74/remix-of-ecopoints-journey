import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BatteryCharging, Car, Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EcoMark } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/use-ecopoints";
import { cn } from "@/lib/utils";
import {
  digitsOnly,
  lettersOnly,
  nameError,
  phoneError,
  scholarError,
} from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your carpool profile — EcoPoints" },
      {
        name: "description",
        content:
          "Tell us about your home, your vehicle and your ward so EcoPoints can score your school runs.",
      },
      { property: "og:title", content: "Set up your carpool profile — EcoPoints" },
      { property: "og:description", content: "Three quick steps before your first shared ride." },
    ],
  }),
  component: Onboarding,
});

const STEPS = [
  { title: "About you", icon: User },
  { title: "Your vehicle", icon: Car },
  { title: "Your ward", icon: BatteryCharging },
];

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState("5");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [seats, setSeats] = useState("4");
  const [isEv, setIsEv] = useState(false);
  const [arrivalTime, setArrivalTime] = useState("07:30");
  const [childName, setChildName] = useState("");
  const [scholarNumber, setScholarNumber] = useState("");
  const [grade, setGrade] = useState("");

  useEffect(() => {
    if (profile?.onboarded) navigate({ to: "/dashboard", replace: true });
  }, [profile?.onboarded, navigate]);

  const fullNameErr = fullName ? nameError(fullName, "Your name") : null;
  const phoneErr = phone ? phoneError(phone) : null;
  const childNameErr = childName ? nameError(childName, "Child's name") : null;
  const scholarErr = scholarNumber ? scholarError(scholarNumber) : null;

  function next() {
    if (step === 0) {
      const err = nameError(fullName, "Your name") ?? phoneError(phone);
      if (err) {
        toast.error(err);
        return;
      }
      if (!homeAddress.trim()) {
        toast.error("Please add your home address.");
        return;
      }
    }
    if (step === 1 && !vehicleNumber.trim()) {
      toast.error("Please add your vehicle number.");
      return;
    }
    setStep((s) => s + 1);
  }

  async function finish() {
    const err = nameError(childName, "Child's name") ?? scholarError(scholarNumber);
    if (err) {
      toast.error(err);
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      const { error: pErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        home_address: homeAddress.trim(),
        distance_km: Number(distanceKm) || 0,
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        vehicle_seats: Math.max(1, Number(seats) || 4),
        is_ev: isEv,
        arrival_time: `${arrivalTime}:00`,
        onboarded: true,
      });
      if (pErr) throw pErr;

      const { error: wErr } = await supabase.from("wards").insert({
        parent_id: user.id,
        child_name: childName.trim(),
        scholar_number: scholarNumber.trim(),
        grade: grade.trim(),
      });
      if (wErr) throw wErr;

      await queryClient.invalidateQueries();
      toast.success("You're all set. Welcome to EcoPoints!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain-surface min-h-screen px-5 py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center justify-center gap-3">
          <EcoMark />
          <span className="text-display text-xl font-semibold">EcoPoints</span>
        </div>

        <ol className="mt-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.title}
              </span>
              {i < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-3xl border border-border bg-card p-7 shadow-lift">
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-display text-2xl font-semibold">About you</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Other parents see your name when they hand a child to you.
                </p>
              </div>
              <Field label="Full name">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ananya Sharma" />
              </Field>
              <Field label="Phone number">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Home address">
                <Input
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="Flat 402, Green Meadows, Sector 12"
                />
              </Field>
              <Field label="Distance from school (km)">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-display text-2xl font-semibold">Your vehicle</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Seats decide how many children you can log in a day.
                </p>
              </div>
              <Field label="Vehicle number">
                <Input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="MH 12 AB 3456"
                />
              </Field>
              <Field label="Passenger seats (excluding driver)">
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                />
              </Field>
              <Field label="Usual arrival time at school">
                <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
              </Field>
              <div className="flex items-start justify-between gap-4 rounded-2xl bg-secondary p-4">
                <div>
                  <p className="font-medium text-secondary-foreground">Electric vehicle</p>
                  <p className="text-sm text-muted-foreground">
                    EV drivers earn a passive 2,000 points on every day they log a run.
                  </p>
                </div>
                <Switch checked={isEv} onCheckedChange={setIsEv} aria-label="Electric vehicle" />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-display text-2xl font-semibold">Your ward</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your own child studying at the school. You can add more later.
                </p>
              </div>
              <Field label="Child's name">
                <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Vihaan Sharma" />
              </Field>
              <Field label="Scholar number">
                <Input
                  value={scholarNumber}
                  onChange={(e) => setScholarNumber(e.target.value)}
                  placeholder="2024-1188"
                />
              </Field>
              <Field label="Grade / section">
                <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="VII-B" />
              </Field>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || busy}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step < 2 ? (
              <Button onClick={next} className="gap-2">
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Finish setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
