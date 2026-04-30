DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT user_id INTO target_user_id
  FROM public.profiles
  WHERE lower(email) = lower('elcio.oliveira@netturbo.com.br')
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado para o e-mail elcio.oliveira@netturbo.com.br';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin');
END $$;