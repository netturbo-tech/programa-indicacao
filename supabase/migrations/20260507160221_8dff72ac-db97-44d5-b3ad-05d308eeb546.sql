-- Lock down public-schema duplicates of role/permission helpers.
-- The RLS policies use private.has_role and private.indicacao_update_allowed;
-- the public.* copies should not be callable by clients.

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.indicacao_update_allowed(
  uuid, public.status_indicacao, text, text, text, text, public.produto_tipo,
  text, public.setor_tipo, text, public.contrato_tipo, text, uuid, text, text, boolean
) FROM PUBLIC, anon, authenticated;