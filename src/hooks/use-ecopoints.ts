import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  home_address: string;
  distance_km: number;
  vehicle_number: string;
  vehicle_seats: number;
  is_ev: boolean;
  arrival_time: string;
  onboarded: boolean;
};

export type CarpoolChild = {
  id: string;
  child_name: string;
  scholar_number: string;
  guardian_name: string;
  guardian_contact: string;
  drop_address: string;
  is_far: boolean;
  status: string;
  otp_expires_at: string;
  approved_at: string | null;
  created_at: string;
};

export type PickupLog = {
  id: string;
  log_date: string;
  child_id: string | null;
  kind: string;
  points: number;
};

export type LeaderboardRow = {
  parent_id: string;
  full_name: string | null;
  is_ev: boolean;
  total_points: number;
  children_helped: number;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      setSession(s.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, ready, user: session?.user ?? null };
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });
}

export function useCarpoolChildren() {
  return useQuery({
    queryKey: ["carpool-children"],
    queryFn: async (): Promise<CarpoolChild[]> => {
      const { data, error } = await supabase
        .from("carpool_children")
        .select(
          "id, child_name, scholar_number, guardian_name, guardian_contact, drop_address, is_far, status, otp_expires_at, approved_at, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CarpoolChild[];
    },
  });
}

export function useWards() {
  return useQuery({
    queryKey: ["wards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wards")
        .select("id, child_name, scholar_number, grade")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePickupLogs() {
  return useQuery({
    queryKey: ["pickup-logs"],
    queryFn: async (): Promise<PickupLog[]> => {
      const { data, error } = await supabase
        .from("pickup_logs")
        .select("id, log_date, child_id, kind, points")
        .order("log_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PickupLog[];
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc("get_leaderboard");
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
  });
}
