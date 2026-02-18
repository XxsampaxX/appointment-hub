
-- Fix: restrict insert to service role only (drop permissive policy)
DROP POLICY IF EXISTS "Service role can insert logs" ON public.whatsapp_logs;
