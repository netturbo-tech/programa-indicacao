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
  initial_role public.app_role;
BEGIN
  raw_identifier := COALESCE(NEW.raw_user_meta_data ->> 'login_identifier', NEW.email);
  normalized_identifier := lower(trim(raw_identifier));
  raw_ra := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'ra', '')), '');
  raw_cpf := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'cpf', '')), '');

  -- Se cadastrou com RA, vira "usuario_ra" automaticamente
  IF raw_ra IS NOT NULL THEN
    initial_role := 'usuario_ra';
  ELSE
    initial_role := 'usuario';
  END IF;

  INSERT INTO public.profiles (user_id, name, email, login_identifier, ra, cpf, funcao, contrato, setor)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    normalized_identifier,
    raw_ra,
    raw_cpf,
    COALESCE(NEW.raw_user_meta_data ->> 'funcao', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'contrato')::public.contrato_tipo, 'CLT'),
    COALESCE((NEW.raw_user_meta_data ->> 'setor')::public.setor_tipo, 'COMERCIAL')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, initial_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;