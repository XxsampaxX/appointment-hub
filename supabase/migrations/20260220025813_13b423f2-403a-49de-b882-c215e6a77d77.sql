
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS email_reminder_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.appointments.email_reminder_sent IS 'Indica se o lembrete por e-mail já foi enviado para este agendamento';
