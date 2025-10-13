-- Política para permitir actualizaciones en la tabla picks
-- Esta política permite al servicio de la API actualizar los picks

-- Primero, verificar si RLS está habilitado
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'picks';

-- Crear política para UPDATE en picks (permite actualizar result y points_earned)
DROP POLICY IF EXISTS "Allow API updates on picks" ON picks;

CREATE POLICY "Allow API updates on picks" 
ON picks 
FOR UPDATE 
TO authenticated, anon
USING (true)  -- Permite actualizar cualquier pick
WITH CHECK (true);  -- Permite cualquier actualización

-- También crear política para SELECT si no existe
DROP POLICY IF EXISTS "Allow API select on picks" ON picks;

CREATE POLICY "Allow API select on picks" 
ON picks 
FOR SELECT 
TO authenticated, anon
USING (true);  -- Permite leer cualquier pick

-- Crear política para INSERT si es necesaria
DROP POLICY IF EXISTS "Allow API insert on picks" ON picks;

CREATE POLICY "Allow API insert on picks" 
ON picks 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Crear políticas para la tabla entries
DROP POLICY IF EXISTS "Allow API updates on entries" ON entries;

CREATE POLICY "Allow API updates on entries" 
ON entries 
FOR UPDATE 
TO authenticated, anon
USING (true)  
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API select on entries" ON entries;

CREATE POLICY "Allow API select on entries" 
ON entries 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Verificar políticas existentes
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('picks', 'entries');