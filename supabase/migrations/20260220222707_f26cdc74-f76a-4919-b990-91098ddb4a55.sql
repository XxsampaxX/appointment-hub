
-- Add created_by to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing companies with the master admin's id
UPDATE public.companies SET created_by = '166250f2-7de5-4847-aa5a-a6220fb9eec6' WHERE created_by IS NULL;
