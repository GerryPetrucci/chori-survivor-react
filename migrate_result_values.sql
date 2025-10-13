-- Script para migrar valores de result de formato antiguo a nuevo
-- Este script normaliza todos los valores de result en la tabla picks

-- Migrar valores antiguos a nuevos
UPDATE picks 
SET result = CASE 
    WHEN result = 'win' THEN 'W'
    WHEN result = 'loss' THEN 'L' 
    WHEN result = 'draw' THEN 'T'
    ELSE result  -- Mantener valores que ya están en formato nuevo
END
WHERE result IN ('win', 'loss', 'draw');

-- Verificar la migración
SELECT result, COUNT(*) as count 
FROM picks 
GROUP BY result 
ORDER BY result;

-- Crear políticas para la tabla entries si es necesario
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

-- Verificar políticas de entries
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'entries';