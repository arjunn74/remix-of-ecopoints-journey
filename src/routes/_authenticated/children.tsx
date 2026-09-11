import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, Plus, RefreshCw, Trash2, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useCarpoolChildren, useProfile, useSession, useWards } from "@/hooks/use-ecopoints";
import type { CarpoolChild } from "@/hooks/use-ecopoints";
import { otpTimeLeft } from "@/lib/ecopoints";

export const Route = createFileRoute("/_authenticated/children")({
  head: () => ({
    meta: [
      { title: "Children — EcoPoints" },
      {
        name: "description",
        content:
          "Add the classmates you carpool, track pending permissions and enter the 6-digit code from their parent.",
      },
      { property: "og:title", content: "Children — EcoPoints" },
      { property: "og:description", content: "Manage the children you carpool and their permissions." },
    ],
  }),
  component: ChildrenPage,
});

function ChildrenPage() {
  const { data: children = [], isLoading } = useCarpoolChildren();
  const { data: wards = [] } = useWards();
  const { data: profile } = useProfile();

  const approved = children.filter((c) => c.status === "approved");
  const pending = children.filter((c) => c.status !== "approved");

  return (
    <AppShell
      title="Children"
      subtitle="Your own wards, plus the classmates you drop home each day."
      action={<AddChildDialog seats={profile?.vehicle_seats ?? 4} />}
    >
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Users className="size-3.5" />
          Your wards
        </div>
        <ul className="mt-4 flex flex-wrap gap-3">
          {wards.length === 0 ? (
            <li className="text-sm text-muted-foreground">No wards added yet.</li>
          ) : (
            wards.map((w) => (
              <li key={w.id} className="rounded-2xl bg-secondary px-4 py-3">
                <p className="font-semibold">{w.child_name}</p>
                <p className="text-xs text-muted-foreground">
                  {w.scholar_number}
                  {w.grade ? ` · ${w.grade}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <Tabs defaultValue="approved" className="mt-6">
        <TabsList>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="mt-5">
          {isLoading ? (
            <Skeleton className="h-24 rounded-3xl" />
          ) : approved.length === 0 ? (
            <Empty text="No approved children yet. Once their parent shares the permission code, they show up here." />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {approved.map((c) => (
                <ChildCard key={c.id} child={c} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-5">
          {pending.length === 0 ? (
            <Empty text="Nothing pending. Add a classmate and ask their parent for the 6-digit code." />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {pending.map((c) => (
                <ChildCard key={c.id} child={c} pending />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

function ChildCard({ child, pending }: { child: CarpoolChild; pending?: boolean }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const expiry = otpTimeLeft(child.otp_expires_at);

  async function approve() {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("approve_carpool_child", {
        p_child_id: child.id,
        p_code: code,
      });
      if (error) throw error;
      if (data === "approved") {
        toast.success(`${child.child_name} is approved.`);
        await queryClient.invalidateQueries();
      } else if (data === "expired") {
        toast.error("That code has expired. Ask for a fresh one.");
      } else {
        toast.error("That code doesn't match. Check with their parent.");
      }
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify the code.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("regenerate_carpool_otp", { p_child_id: child.id });
      if (error) throw error;
      toast.success("A fresh code was issued to their parent.");
      await queryClient.invalidateQueries({ queryKey: ["carpool-children"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not issue a new code.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("carpool_children").delete().eq("id", child.id);
    setBusy(false);
    if (error) {
      toast.error("Could not remove this child.");
      return;
    }
    toast.success(`${child.child_name} removed.`);
    await queryClient.invalidateQueries();
  }

  return (
    <li className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-display text-lg font-semibold">{child.child_name}</p>
          <p className="text-sm text-muted-foreground">
            {child.scholar_number} · guardian {child.guardian_name}
          </p>
        </div>
        <span
          className={
            pending
              ? "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              : "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary"
          }
        >
          {pending ? <Clock className="size-3" /> : <CheckCircle2 className="size-3" />}
          {pending ? "Pending" : "Approved"}
        </span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{child.drop_address}</p>
      {child.is_far ? (
        <p className="mt-1 text-xs font-medium text-clay">Over 10 km — earns a 2,000 point bonus</p>
      ) : null}

      {pending ? (
        <div className="mt-5 space-y-3 rounded-2xl bg-secondary p-4">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Permission code from their parent</Label>
            <span className="text-xs text-muted-foreground">{expiry.label}</span>
          </div>
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy || expiry.expired}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={approve} disabled={busy || code.length !== 6}>
              {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
              Verify
            </Button>
            <Button size="sm" variant="outline" onClick={regenerate} disabled={busy} className="gap-1.5">
              <RefreshCw className="size-3.5" />
              New code
            </Button>
            <Button size="sm" variant="ghost" onClick={remove} disabled={busy} className="gap-1.5">
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={busy}
          className="mt-4 gap-1.5 text-muted-foreground"
        >
          <Trash2 className="size-3.5" />
          Remove
        </Button>
      )}
    </li>
  );
}

function AddChildDialog({ seats }: { seats: number }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    child_name: "",
    scholar_number: "",
    guardian_name: "",
    guardian_contact: "",
    drop_address: "",
  });
  const [isFar, setIsFar] = useState(false);
  const [permission, setPermission] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit() {
    if (!user) return;
    if (!form.child_name.trim() || !form.scholar_number.trim() || !form.drop_address.trim()) {
      toast.error("Child name, scholar number and drop address are required.");
      return;
    }
    if (!permission) {
      toast.error("Confirm that their parent has agreed to this carpool.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("carpool_children").insert({
      parent_id: user.id,
      child_name: form.child_name.trim(),
      scholar_number: form.scholar_number.trim(),
      guardian_name: form.guardian_name.trim(),
      guardian_contact: form.guardian_contact.trim(),
      drop_address: form.drop_address.trim(),
      is_far: isFar,
      has_permission: true,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Added. A 6-digit code was issued to their parent — valid for 24 hours.");
    setForm({
      child_name: "",
      scholar_number: "",
      guardian_name: "",
      guardian_contact: "",
      drop_address: "",
    });
    setIsFar(false);
    setPermission(false);
    setOpen(false);
    await queryClient.invalidateQueries();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Add child
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display">Add a classmate</DialogTitle>
          <DialogDescription>
            You can log up to {seats} children a day — your vehicle's seat count.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Child's name</Label>
            <Input value={form.child_name} onChange={set("child_name")} placeholder="Aarav Mehta" />
          </div>
          <div className="space-y-2">
            <Label>Scholar number</Label>
            <Input value={form.scholar_number} onChange={set("scholar_number")} placeholder="2024-0912" />
          </div>
          <div className="space-y-2">
            <Label>Their parent / guardian</Label>
            <Input value={form.guardian_name} onChange={set("guardian_name")} placeholder="Rhea Mehta" />
          </div>
          <div className="space-y-2">
            <Label>Guardian contact</Label>
            <Input value={form.guardian_contact} onChange={set("guardian_contact")} placeholder="+91 90000 12345" />
          </div>
          <div className="space-y-2">
            <Label>Drop address</Label>
            <Input value={form.drop_address} onChange={set("drop_address")} placeholder="B-14, Palm Enclave" />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-secondary p-4">
            <div>
              <p className="font-medium text-secondary-foreground">Over 10 km from school</p>
              <p className="text-sm text-muted-foreground">Adds a 2,000 point bonus per drop.</p>
            </div>
            <Switch checked={isFar} onCheckedChange={setIsFar} aria-label="Far drop" />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
            <div>
              <p className="font-medium">Their parent has agreed</p>
              <p className="text-sm text-muted-foreground">
                They'll receive a 6-digit code to confirm. Points start only after you enter it.
              </p>
            </div>
            <Switch checked={permission} onCheckedChange={setPermission} aria-label="Parent permission" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Add child
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
