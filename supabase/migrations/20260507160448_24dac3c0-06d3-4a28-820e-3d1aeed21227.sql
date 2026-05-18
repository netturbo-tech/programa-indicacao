GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.indicacao_update_allowed(
  uuid, public.status_indicacao, text, text, text, text, public.produto_tipo,
  text, public.setor_tipo, text, public.contrato_tipo, text, uuid, text, text, boolean
) TO authenticated;