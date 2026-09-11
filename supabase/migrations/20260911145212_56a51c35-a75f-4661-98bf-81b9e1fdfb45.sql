CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  home_address TEXT NOT NULL DEFAULT '',
  distance_km NUMERIC NOT NULL DEFAULT 0,
  vehicle_number TEXT NOT NULL DEFAULT '',
  vehicle_seats INTEGER NOT NULL DEFAULT 4,
  is_ev BOOLEAN NOT NULL DEFAULT false,
  arrival_time TIME NOT NULL DEFAULT '07:30',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  scholar_number TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wards TO authenticated;
GRANT ALL ON public.wards TO service_role;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wards" ON public.wards FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

CREATE TABLE public.carpool_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  scholar_number TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_contact TEXT NOT NULL DEFAULT '',
  drop_address TEXT NOT NULL,
  is_far BOOLEAN NOT NULL DEFAULT false,
  has_permission BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  otp_code TEXT NOT NULL DEFAULT lpad((floor(random() * 1000000))::int::text, 6, '0'),
  otp_expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '24 hours',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT (id, parent_id, child_name, scholar_number, guardian_name, guardian_contact, drop_address, is_far, has_permission, status, otp_expires_at, approved_at, created_at) ON public.carpool_children TO authenticated;
GRANT INSERT (parent_id, child_name, scholar_number, guardian_name, guardian_contact, drop_address, is_far, has_permission) ON public.carpool_children TO authenticated;
GRANT DELETE ON public.carpool_children TO authenticated;
GRANT ALL ON public.carpool_children TO service_role;
ALTER TABLE public.carpool_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own carpool children read" ON public.carpool_children FOR SELECT TO authenticated USING (auth.uid() = parent_id);
CREATE POLICY "own carpool children insert" ON public.carpool_children FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id AND has_permission = true);
CREATE POLICY "own carpool children delete" ON public.carpool_children FOR DELETE TO authenticated USING (auth.uid() = parent_id);

CREATE TABLE public.pickup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  child_id UUID REFERENCES public.carpool_children(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'pickup',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pickup_logs_child_day ON public.pickup_logs (parent_id, log_date, child_id) WHERE child_id IS NOT NULL;
CREATE UNIQUE INDEX pickup_logs_bonus_day ON public.pickup_logs (parent_id, log_date, kind) WHERE child_id IS NULL;
GRANT SELECT ON public.pickup_logs TO authenticated;
GRANT ALL ON public.pickup_logs TO service_role;
ALTER TABLE public.pickup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs read" ON public.pickup_logs FOR SELECT TO authenticated USING (auth.uid() = parent_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.approve_carpool_child(p_child_id UUID, p_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.carpool_children;
BEGIN
  SELECT * INTO r FROM public.carpool_children WHERE id = p_child_id AND parent_id = auth.uid();
  IF r.id IS NULL THEN RETURN 'not_found'; END IF;
  IF r.status = 'approved' THEN RETURN 'already_approved'; END IF;
  IF r.otp_expires_at < now() THEN RETURN 'expired'; END IF;
  IF r.otp_code <> trim(p_code) THEN RETURN 'invalid'; END IF;
  UPDATE public.carpool_children SET status = 'approved', approved_at = now() WHERE id = p_child_id;
  RETURN 'approved';
END; $$;
REVOKE ALL ON FUNCTION public.approve_carpool_child(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_carpool_child(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.regenerate_carpool_otp(p_child_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.carpool_children
     SET otp_code = lpad((floor(random() * 1000000))::int::text, 6, '0'),
         otp_expires_at = now() + interval '24 hours',
         status = 'pending'
   WHERE id = p_child_id AND parent_id = auth.uid() AND status <> 'approved';
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  RETURN 'sent';
END; $$;
REVOKE ALL ON FUNCTION public.regenerate_carpool_otp(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_carpool_otp(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_pickups(p_date DATE, p_child_ids UUID[])
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prof public.profiles;
  n INTEGER;
  total INTEGER := 0;
  c public.carpool_children;
  pts INTEGER;
BEGIN
  SELECT * INTO prof FROM public.profiles WHERE id = auth.uid();
  IF prof.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_profile'); END IF;
  IF p_date > CURRENT_DATE OR p_date < CURRENT_DATE - 7 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_date');
  END IF;

  SELECT count(*) INTO n FROM public.carpool_children
   WHERE parent_id = auth.uid() AND status = 'approved' AND id = ANY(p_child_ids);
  IF n <> coalesce(array_length(p_child_ids, 1), 0) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_approved');
  END IF;
  IF n > 0 AND n < 2 THEN RETURN jsonb_build_object('ok', false, 'error', 'min_two'); END IF;
  IF n > prof.vehicle_seats THEN RETURN jsonb_build_object('ok', false, 'error', 'over_seats'); END IF;

  DELETE FROM public.pickup_logs WHERE parent_id = auth.uid() AND log_date = p_date;

  FOR c IN SELECT * FROM public.carpool_children WHERE parent_id = auth.uid() AND id = ANY(p_child_ids) LOOP
    pts := 1000 + CASE WHEN c.is_far THEN 2000 ELSE 0 END;
    INSERT INTO public.pickup_logs (parent_id, log_date, child_id, kind, points)
    VALUES (auth.uid(), p_date, c.id, 'pickup', pts);
    total := total + pts;
  END LOOP;

  IF prof.is_ev THEN
    INSERT INTO public.pickup_logs (parent_id, log_date, child_id, kind, points)
    VALUES (auth.uid(), p_date, NULL, 'ev_bonus', 2000);
    total := total + 2000;
  END IF;

  RETURN jsonb_build_object('ok', true, 'points', total, 'children', n);
END; $$;
REVOKE ALL ON FUNCTION public.log_pickups(DATE, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_pickups(DATE, UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (parent_id UUID, full_name TEXT, is_ev BOOLEAN, total_points BIGINT, children_helped BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT p.id,
         NULLIF(p.full_name, '') AS full_name,
         p.is_ev,
         COALESCE(SUM(l.points), 0)::BIGINT,
         COUNT(DISTINCT l.child_id)::BIGINT
    FROM public.profiles p
    LEFT JOIN public.pickup_logs l ON l.parent_id = p.id
   WHERE p.onboarded = true
   GROUP BY p.id
   ORDER BY 4 DESC, 2 ASC
   LIMIT 100
$$;
REVOKE ALL ON FUNCTION public.get_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;