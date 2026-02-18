
-- Add reminder_sent flag to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;

-- Create whatsapp_logs table
CREATE TABLE public.whatsapp_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  phone text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('confirmacao', 'lembrete')),
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view whatsapp logs"
  ON public.whatsapp_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert logs"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (true);
