-- ═══════════════════════════════════════════════════════
-- Migration v11: Tabla dias_no_lectivos
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dias_no_lectivos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE NOT NULL,
  fecha          DATE NOT NULL,
  motivo         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institucion_id, fecha)
);

ALTER TABLE dias_no_lectivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY dnl_acceso ON dias_no_lectivos
FOR ALL TO authenticated
USING (
  institucion_id = (SELECT institucion_id FROM usuarios WHERE id = auth.uid())
)
WITH CHECK (
  institucion_id = (SELECT institucion_id FROM usuarios WHERE id = auth.uid())
);

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
