
CREATE OR REPLACE FUNCTION public.auto_create_client_on_member_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
BEGIN
  IF NEW.role = 'user' THEN
    SELECT name, email, phone INTO _profile
    FROM public.profiles WHERE id = NEW.user_id;

    IF FOUND THEN
      INSERT INTO public.clients (company_id, name, email, phone, notes)
      VALUES (NEW.company_id, _profile.name, COALESCE(_profile.email, ''), COALESCE(_profile.phone, ''), '')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_client_on_member
  AFTER INSERT ON public.company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_client_on_member_insert();
