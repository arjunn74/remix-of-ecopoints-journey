CREATE TABLE public.demo_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  is_ev boolean NOT NULL DEFAULT false,
  total_points bigint NOT NULL DEFAULT 0,
  children_helped bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.demo_leaderboard TO service_role;
ALTER TABLE public.demo_leaderboard ENABLE ROW LEVEL SECURITY;

INSERT INTO public.demo_leaderboard (full_name, is_ev, total_points, children_helped) VALUES
('Meera Iyer', true, 184000, 4),
('Rajesh Nair', false, 161500, 3),
('Sunita Deshmukh', true, 143000, 4),
('Arvind Kulkarni', false, 118000, 3),
('Fatima Sheikh', true, 104500, 3),
('Karthik Reddy', false, 92000, 2),
('Neha Bansal', true, 87500, 3),
('Sandeep Chawla', false, 76000, 2),
('Priya Venkatesh', false, 68500, 3),
('Imran Qureshi', true, 61000, 2),
('Anjali Rao', false, 54500, 2),
('Vikram Joshi', true, 48000, 3),
('Deepa Menon', false, 41500, 2),
('Harpreet Gill', false, 36000, 2),
('Rohit Saxena', true, 31500, 2),
('Lakshmi Pillai', false, 27000, 2),
('Ayesha Khan', false, 22500, 2),
('Manish Agarwal', true, 18000, 2),
('Swati Kulshrestha', false, 12500, 2),
('Tarun Bhatt', false, 7500, 2);

CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(parent_id uuid, full_name text, is_ev boolean, total_points bigint, children_helped bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    SELECT p.id AS parent_id,
           NULLIF(p.full_name, '') AS full_name,
           p.is_ev,
           COALESCE(SUM(l.points), 0)::BIGINT AS total_points,
           COUNT(DISTINCT l.child_id)::BIGINT AS children_helped
      FROM public.profiles p
      LEFT JOIN public.pickup_logs l ON l.parent_id = p.id
     WHERE p.onboarded = true
     GROUP BY p.id
    UNION ALL
    SELECT d.id, d.full_name, d.is_ev, d.total_points, d.children_helped
      FROM public.demo_leaderboard d
  ) rows
  ORDER BY total_points DESC, full_name ASC
  LIMIT 100
$function$;