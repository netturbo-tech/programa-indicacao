CREATE OR REPLACE FUNCTION public.indicacao_update_allowed(
  _id uuid,
  _status public.status_indicacao,
  _lead_nome text,
  _empresa text,
  _telefone text,
  _email_lead text,
  _produto public.produto_tipo,
  _email_indicador text,
  _setor public.setor_tipo,
  _funcao text,
  _contrato public.contrato_tipo,
  _observacao text,
  _criado_por_id uuid,
  _criado_por_nome text,
  _modificado_por_nome text,
  _recompensa_paga boolean
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_row public.indicacoes%ROWTYPE;
BEGIN
  SELECT * INTO old_row
  FROM public.indicacoes
  WHERE id = _id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN true;
  END IF;

  IF public.has_role(auth.uid(), 'aprovador') THEN
    RETURN old_row.lead_nome = _lead_nome
      AND old_row.empresa = _empresa
      AND old_row.telefone = _telefone
      AND old_row.email_lead = _email_lead
      AND old_row.produto = _produto
      AND old_row.email_indicador = _email_indicador
      AND old_row.setor = _setor
      AND old_row.funcao = _funcao
      AND old_row.contrato = _contrato
      AND old_row.observacao = _observacao
      AND old_row.criado_por_id = _criado_por_id
      AND old_row.criado_por_nome = _criado_por_nome
      AND old_row.recompensa_paga = _recompensa_paga;
  END IF;

  RETURN auth.uid() = old_row.criado_por_id
    AND auth.uid() = _criado_por_id;
END;
$$;

DROP POLICY IF EXISTS "Authenticated users can view all indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Author, approvers and admins can update indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Author and admins can delete indicacoes" ON public.indicacoes;

CREATE POLICY "Users view own indicacoes, approvers and admins view all"
ON public.indicacoes
FOR SELECT
TO authenticated
USING (
  auth.uid() = criado_por_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'aprovador')
);

CREATE POLICY "Users update own indicacoes, approvers only status, admins all"
ON public.indicacoes
FOR UPDATE
TO authenticated
USING (
  auth.uid() = criado_por_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'aprovador')
)
WITH CHECK (
  public.indicacao_update_allowed(
    id,
    status,
    lead_nome,
    empresa,
    telefone,
    email_lead,
    produto,
    email_indicador,
    setor,
    funcao,
    contrato,
    observacao,
    criado_por_id,
    criado_por_nome,
    modificado_por_nome,
    recompensa_paga
  )
);

CREATE POLICY "Users delete own indicacoes, admins delete all"
ON public.indicacoes
FOR DELETE
TO authenticated
USING (
  auth.uid() = criado_por_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Authenticated users can view all contatos" ON public.contatos;
DROP POLICY IF EXISTS "Author, approvers and admins can update contatos" ON public.contatos;
DROP POLICY IF EXISTS "Author and admins can delete contatos" ON public.contatos;

CREATE POLICY "Users view own contatos, approvers and admins view all"
ON public.contatos
FOR SELECT
TO authenticated
USING (
  auth.uid() = criado_por_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'aprovador')
);

CREATE POLICY "Users update own contatos, admins update all"
ON public.contatos
FOR UPDATE
TO authenticated
USING (
  auth.uid() = criado_por_id
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = criado_por_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users delete own contatos, admins delete all"
ON public.contatos
FOR DELETE
TO authenticated
USING (
  auth.uid() = criado_por_id
  OR public.has_role(auth.uid(), 'admin')
);