-- Habilitar RLS en user_profiles si no está habilitado
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes antes de crear las nuevas
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.user_profiles;
-- Compat: some previous runs created a policy with a Spanish name; remove it if present
DROP POLICY IF EXISTS "Allow profile creation durante signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Crear helper SECURITY DEFINER para chequear admin sin causar recursión
CREATE OR REPLACE FUNCTION public.is_requester_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Crear política para permitir insertar perfiles durante el registro
CREATE POLICY "Allow profile creation durante signup" ON public.user_profiles
FOR INSERT WITH CHECK (true);

-- Crear política para permitir a los usuarios ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

-- Crear política para permitir a los usuarios actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Crear política para permitir a los admins ver todos los perfiles (usa helper SECURITY DEFINER)
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (public.is_requester_admin());

-- Crear política para permitir a los admins actualizar todos los perfiles (usa helper SECURITY DEFINER)
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
FOR UPDATE USING (public.is_requester_admin());