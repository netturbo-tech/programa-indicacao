DROP POLICY IF EXISTS "Usuario RA can create contatos" ON public.contatos;

CREATE POLICY "Usuario RA and admins can create contatos"
ON public.contatos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = criado_por_id
  AND (
    private.has_role(auth.uid(), 'usuario_ra'::app_role)
    OR private.has_role(auth.uid(), 'admin'::app_role)
  )
);