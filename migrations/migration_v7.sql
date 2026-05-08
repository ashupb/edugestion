-- =====================================================
-- MIGRATION V7 — Instancias calificación primaria
-- =====================================================

-- 1. Tabla instancias_calificacion
--    Una fila por alumno × materia × periodo × instancia evaluativa
--    (distinta de instancias_evaluativas que es por evento de curso para secundaria)
CREATE TABLE IF NOT EXISTS instancias_calificacion (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alumno_id      uuid REFERENCES alumnos(id)             ON DELETE CASCADE NOT NULL,
  materia_id     uuid REFERENCES materias(id)            ON DELETE CASCADE NOT NULL,
  curso_id       uuid REFERENCES cursos(id)              ON DELETE CASCADE NOT NULL,
  periodo_id     uuid REFERENCES periodos_evaluativos(id) ON DELETE CASCADE NOT NULL,
  institucion_id uuid REFERENCES instituciones(id)       ON DELETE CASCADE NOT NULL,
  nombre         text NOT NULL,
  valor_numerico numeric(4,2),
  valor_conceptual text,
  fecha          date,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE instancias_calificacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ic_select" ON instancias_calificacion FOR SELECT
  USING (institucion_id IN (SELECT institucion_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "ic_insert" ON instancias_calificacion FOR INSERT
  WITH CHECK (institucion_id IN (SELECT institucion_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "ic_update" ON instancias_calificacion FOR UPDATE
  USING (institucion_id IN (SELECT institucion_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "ic_delete" ON instancias_calificacion FOR DELETE
  USING (institucion_id IN (SELECT institucion_id FROM usuarios WHERE id = auth.uid()));

-- 2. Índice parcial en calificaciones para nota final de boletín (primaria)
--    Permite upsert by (alumno_id, materia_id, periodo_id) cuando instancia_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS calificaciones_nota_final_primaria_idx
  ON calificaciones (alumno_id, materia_id, periodo_id)
  WHERE instancia_id IS NULL AND materia_id IS NOT NULL;

-- =====================================================
-- EJECUTAR EN: Supabase → SQL Editor
-- =====================================================
