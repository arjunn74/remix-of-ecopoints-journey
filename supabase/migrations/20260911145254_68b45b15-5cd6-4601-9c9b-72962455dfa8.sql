REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_carpool_child(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.regenerate_carpool_otp(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.log_pickups(DATE, UUID[]) FROM anon;
REVOKE ALL ON FUNCTION public.get_leaderboard() FROM anon;