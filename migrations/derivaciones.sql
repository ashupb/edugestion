-- ═══════════════════════════════════════════════════════
-- Migration: tabla derivaciones + RLS
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS derivaciones (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  institucion_id      UUID        NOT NULL REFERENCES instituciones(id),
  alumno_id           UUID        NOT NULL REFERENCES alumnos(id),
  problematica_id     UUID        REFERENCES problematicas(id),
  tipo_servicio       TEXT        NOT NULL CHECK (tipo_servicio IN (
                        'salud_mental', 'hospital', 'trabajo_social',
                        'justicia', 'educacion_especial', 'otro'
                      )),
  institucion_destino TEXT        NOT NULL,
  profesional_destino TEXT,
  fecha_derivacion    DATE        NOT NULL,
  motivo              TEXT        NOT NULL,
  estado              TEXT        NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
                        'pendiente', 'en_seguimiento', 'con_respuesta', 'cerrada'
                      )),
  respuesta           TEXT,
  fecha_respuesta     DATE,
  creado_por          UUID        NOT NULL REFERENCES usuarios(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE derivaciones ENABLE ROW LEVEL SECURITY;

-- EOE, director_general y directivo_nivel pueden ver derivaciones de su institución
CREATE POLICY "derivaciones_select" ON derivaciones
  FOR SELECT USING (
    institucion_id = (SELECT institucion_id FROM usuarios WHERE id = auth.uid())
    AND (SELECT rol FROM usuarios WHERE id = auth.uid())
        IN ('eoe', 'director_general', 'directivo_nivel')
  );

-- Solo EOE puede insertar
CREATE POLICY "derivaciones_insert" ON derivaciones
  FOR INSERT WITH CHECK (
    institucion_id = (SELECT institucion_id FROM usuarios WHERE id = auth.uid())
    AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'eoe'
    AND creado_por = auth.uid()
  );

-- Solo EOE puede actualizar (registrar respuesta/estado)
CREATE POLICY "derivaciones_update" ON derivaciones
  FOR UPDATE USING (
    institucion_id = (SELECT institucion_id FROM usuarios WHERE id = auth.uid())
    AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'eoe'
  );

-- ─── columna confidencial en observaciones_legajo ─────
ALTER TABLE observaciones_legajo
  ADD COLUMN IF NOT EXISTS confidencial BOOLEAN DEFAULT FALSE;
