
-- Tighten insert policy: only allow system (trigger) inserts via security definer
DROP POLICY "System can insert completion logs" ON public.ride_completion_log;
CREATE POLICY "No direct inserts allowed"
  ON public.ride_completion_log FOR INSERT
  TO authenticated WITH CHECK (false);
