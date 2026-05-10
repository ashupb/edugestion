-- ═══════════════════════════════════════════════════════
-- Migration v18: Drop problematicas_tipo_check constraint
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- La constraint problematicas_tipo_check limita el campo tipo
-- a un enum fijo del schema original. El sistema ahora usa nombres
-- libres desde la tabla tipos_problematicas, por lo que la constraint
-- bloquea todos los inserts con tipos personalizados.
ALTER TABLE problematicas DROP CONSTRAINT IF EXISTS problematicas_tipo_check;

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- ── FIN DE MIGRACIÓN v18 ──────────────────────────────
