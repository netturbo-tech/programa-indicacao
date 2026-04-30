DROP POLICY IF EXISTS "Authenticated users can create contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users view own contatos, approvers and admins view all" ON public.contatos;
DROP POLICY IF EXISTS "Users update own contatos, admins update all" ON public.contatos;
DROP POLICY IF EXISTS "Users delete own contatos, admins delete all" ON public.contatos;

CREATE POLICY "Usuario RA can create contatos"
ON public.contatos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = criado_por_id
  AND private.has_role(auth.uid(), 'usuario_ra'::app_role)
);

CREATE POLICY "Usuario RA view own contatos, approvers and admins view all"
ON public.contatos
FOR SELECT
TO authenticated
USING (
  (auth.uid() = criado_por_id AND private.has_role(auth.uid(), 'usuario_ra'::app_role))
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'aprovador'::app_role)
);

CREATE POLICY "Usuario RA update own contatos, admins update all"
ON public.contatos
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = criado_por_id AND private.has_role(auth.uid(), 'usuario_ra'::app_role))
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (auth.uid() = criado_por_id AND private.has_role(auth.uid(), 'usuario_ra'::app_role))
  OR private.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Usuario RA delete own contatos, admins delete all"
ON public.contatos
FOR DELETE
TO authenticated
USING (
  (auth.uid() = criado_por_id AND private.has_role(auth.uid(), 'usuario_ra'::app_role))
  OR private.has_role(auth.uid(), 'admin'::app_role)
);