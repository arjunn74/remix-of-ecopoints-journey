REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_pickups(date, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_carpool_child(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.regenerate_carpool_otp(uuid) FROM anon;