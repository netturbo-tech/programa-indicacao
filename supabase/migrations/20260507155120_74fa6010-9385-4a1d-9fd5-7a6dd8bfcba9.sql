
-- 1) Restrict profiles SELECT to own row + admins/aprovadores
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and aprovadores can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'aprovador'::app_role)
);

-- 2) Revoke direct EXECUTE on private.has_role from authenticated
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, app_role) FROM PUBLIC;

-- 3) Restrict avatar bucket: drop blanket SELECT, allow authenticated reads only
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

CREATE POLICY "Authenticated users can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
