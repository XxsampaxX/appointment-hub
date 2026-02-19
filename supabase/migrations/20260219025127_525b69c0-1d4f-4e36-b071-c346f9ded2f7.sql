-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('pix', 'dinheiro', 'credito', 'debito');

-- Add payment_method column to appointments
ALTER TABLE public.appointments
ADD COLUMN payment_method public.payment_method NULL;