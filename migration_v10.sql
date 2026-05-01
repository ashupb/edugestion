-- ═══════════════════════════════════════════════════════
-- Migration v10: Drop intervenciones_tipo_check constraint
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- La constraint intervenciones_tipo_check limita el campo tipo
-- a un enum fijo del schema original. El sistema ahora usa nombres
-- libres desde la tabla tipos_intervencion, por lo que la constraint
-- bloquea todos los inserts de seguimiento.
ALTER TABLE intervenciones DROP CONSTRAINT IF EXISTS intervenciones_tipo_check;

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
