REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.indicacao_update_allowed(
  uuid,
  public.status_indicacao,
  text,
  text,
  text,
  text,
  public.produto_tipo,
  text,
  public.setor_tipo,
  text,
  public.contrato_tipo,
  text,
  uuid,
  text,
  text,
  boolean
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.indicacao_update_allowed(
  uuid,
  public.status_indicacao,
  text,
  text,
  text,
  text,
  public.produto_tipo,
  text,
  public.setor_tipo,
  text,
  public.contrato_tipo,
  text,
  uuid,
  text,
  text,
  boolean
) FROM anon;
REVOKE EXECUTE ON FUNCTION public.indicacao_update_allowed(
  uuid,
  public.status_indicacao,
  text,
  text,
  text,
  text,
  public.produto_tipo,
  text,
  public.setor_tipo,
  text,
  public.contrato_tipo,
  text,
  uuid,
  text,
  text,
  boolean
) FROM authenticated;