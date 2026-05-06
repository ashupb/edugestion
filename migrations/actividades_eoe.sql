-- ═══════════════════════════════════════════════════════
-- Migration: columnas actividades EOE en tabla reuniones
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

ALTER TABLE reuniones
  ADD COLUMN IF NOT EXISTS tipo_actividad      TEXT
    CHECK (tipo_actividad IN ('charla', 'taller', 'entrevista_grupal', 'otra')),
  ADD COLUMN IF NOT EXISTS problematica_id     UUID REFERENCES problematicas(id),
  ADD COLUMN IF NOT EXISTS destinatarios_tipo  TEXT
    CHECK (destinatarios_tipo IN ('curso', 'alumnos_individuales')),
  ADD COLUMN IF NOT EXISTS destinatarios_ids   UUID[],
  ADD COLUMN IF NOT EXISTS destinatarios_texto TEXT;

-- Las reuniones existentes sin tipo_actividad quedan con NULL y no aparecen
-- en el panel EOE (el filtro es: tipo_actividad IS NOT NULL).

-- RLS: verificar que EOE pueda hacer INSERT en reuniones.
-- Si la política actual no lo cubre, agregar:
--
-- CREATE POLICY "eoe_insert_actividades" ON reuniones
--   FOR INSERT WITH CHECK (
--     institucion_id = (SELECT institucion_id FROM usuarios WHERE id = auth.uid())
--     AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'eoe'
--   );
--
-- Verificar políticas existentes con:
--   SELECT * FROM pg_policies WHERE tablename = 'reuniones';
