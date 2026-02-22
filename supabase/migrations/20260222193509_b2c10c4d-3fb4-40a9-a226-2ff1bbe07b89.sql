
-- Add working_days column to companies (array of integers 0=Sunday..6=Saturday)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS working_days integer[] DEFAULT ARRAY[1,2,3,4,5];

-- Create blocked_slots table
CREATE TABLE public.blocked_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one block per company/date/time
CREATE UNIQUE INDEX idx_blocked_slots_unique ON public.blocked_slots (company_id, date, time) WHERE active = true;

-- Index for fast lookups
CREATE INDEX idx_blocked_slots_company_date ON public.blocked_slots (company_id, date);

-- Enable RLS
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active blocked slots"
ON public.blocked_slots FOR SELECT
USING (true);

CREATE POLICY "Staff can insert blocked slots"
ON public.blocked_slots FOR INSERT
WITH CHECK (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Staff can update blocked slots"
ON public.blocked_slots FOR UPDATE
USING (is_company_staff(auth.uid(), company_id));

CREATE POLICY "Admin can delete blocked slots"
ON public.blocked_slots FOR DELETE
USING (is_company_admin(auth.uid(), company_id));

-- Trigger for updated_at
CREATE TRIGGER update_blocked_slots_updated_at
BEFORE UPDATE ON public.blocked_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
