-- ═══════════════════════════════════════════════════════
-- Migration: actividades EOE v2 — múltiples encuentros,
--            multi-curso, vinculación a objetivo, agenda,
--            objetivo y resultado separados
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Ampliar CHECK de destinatarios_tipo
ALTER TABLE reuniones DROP CONSTRAINT IF EXISTS reuniones_destinatarios_tipo_check;
ALTER TABLE reuniones ADD CONSTRAINT reuniones_destinatarios_tipo_check
  CHECK (destinatarios_tipo IN (
    'curso',
    'alumnos_individuales',
    'nivel_completo',
    'cursos_multiples'
  ));

-- 2. Nuevas columnas en reuniones
ALTER TABLE reuniones
  ADD COLUMN IF NOT EXISTS objetivo_id        UUID REFERENCES objetivos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS en_agenda          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS objetivo_actividad TEXT,
  ADD COLUMN IF NOT EXISTS resultado          TEXT,
  ADD COLUMN IF NOT EXISTS nivel_destinatario TEXT;

-- 3. Tabla para encuentros adicionales
CREATE TABLE IF NOT EXISTS actividad_encuentros (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID        NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
  fecha      DATE        NOT NULL,
  hora       TIME,
  tematica   TEXT,
  orden      INTEGER     DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS para actividad_encuentros
ALTER TABLE actividad_encuentros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inst_select_encuentros" ON actividad_encuentros
  FOR SELECT USING (
    reunion_id IN (
      SELECT id FROM reuniones
      WHERE institucion_id = (
        SELECT institucion_id FROM usuarios WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "eoe_insert_encuentros" ON actividad_encuentros
  FOR INSERT WITH CHECK (
    reunion_id IN (
      SELECT id FROM reuniones
      WHERE institucion_id = (
        SELECT institucion_id FROM usuarios WHERE id = auth.uid()
      )
    )
    AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'eoe'
  );

CREATE POLICY "eoe_delete_encuentros" ON actividad_encuentros
  FOR DELETE USING (
    (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'eoe'
  );

-- 5. (Opcional) Si EOE no puede insertar en reuniones, ejecutar:
--
-- CREATE POLICY "eoe_insert_actividades" ON reuniones
--   FOR INSERT WITH CHECK (
--     institucion_id = (SELECT institucion_id FROM usuarios WHERE id = auth.uid())
--     AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'eoe'
--   );
--
-- Verificar con: SELECT * FROM pg_policies WHERE tablename = 'reuniones';
