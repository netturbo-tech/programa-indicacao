ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login_identifier TEXT,
ADD COLUMN IF NOT EXISTS ra TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_identifier_key
ON public.profiles (lower(login_identifier))
WHERE login_identifier IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_ra_key
ON public.profiles (lower(ra))
WHERE ra IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_key
ON public.profiles (regexp_replace(cpf, '\D', '', 'g'))
WHERE cpf IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  raw_identifier text;
  normalized_identifier text;
  raw_ra text;
  raw_cpf text;
BEGIN
  raw_identifier := COALESCE(NEW.raw_user_meta_data ->> 'login_identifier', NEW.email);
  normalized_identifier := lower(trim(raw_identifier));
  raw_ra := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'ra', '')), '');
  raw_cpf := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'cpf', '')), '');

  INSERT INTO public.profiles (user_id, name, email, login_identifier, ra, cpf, contrato, setor)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    normalized_identifier,
    raw_ra,
    raw_cpf,
    COALESCE((NEW.raw_user_meta_data ->> 'contrato')::public.contrato_tipo, 'CLT'),
    COALESCE((NEW.raw_user_meta_data ->> 'setor')::public.setor_tipo, 'COMERCIAL')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;