-- ═══════════════════════════════════════════════════════════════
-- Migration v19: RLS para módulo Seguimiento del portal de familias
-- Permite que el rol 'familia' lea trayectoria y calificaciones
-- de sus alumnos vinculados (tabla familia_alumno).
--
-- Ejecutar en Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. materias_estado_alumno ─────────────────────────────────────
ALTER TABLE materias_estado_alumno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materias_estado_acceso" ON materias_estado_alumno;
DROP POLICY IF EXISTS "materias_estado_write"  ON materias_estado_alumno;

-- Lectura: staff institucional O familia con alumno vinculado
CREATE POLICY "materias_estado_acceso" ON materias_estado_alumno
FOR SELECT TO authenticated
USING (
  alumno_id IN (
    SELECT a.id FROM alumnos a
    WHERE a.institucion_id = (
      SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
    )
  )
  OR
  alumno_id IN (
    SELECT fa.alumno_id FROM familia_alumno fa
    WHERE fa.usuario_id = auth.uid()
  )
);

-- Escritura: solo staff (acceso por institución)
CREATE POLICY "materias_estado_write" ON materias_estado_alumno
FOR ALL TO authenticated
USING (
  alumno_id IN (
    SELECT a.id FROM alumnos a
    WHERE a.institucion_id = (
      SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
    )
  )
)
WITH CHECK (
  alumno_id IN (
    SELECT a.id FROM alumnos a
    WHERE a.institucion_id = (
      SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
    )
  )
);


-- ── 2. calificaciones ────────────────────────────────────────────
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calificaciones_select" ON calificaciones;
DROP POLICY IF EXISTS "calificaciones_write"  ON calificaciones;

-- Lectura: staff por institución / familias por alumno vinculado
CREATE POLICY "calificaciones_select" ON calificaciones
FOR SELECT TO authenticated
USING (
  alumno_id IN (
    SELECT a.id FROM alumnos a
    WHERE a.institucion_id = (
      SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
    )
  )
  OR
  alumno_id IN (
    SELECT fa.alumno_id FROM familia_alumno fa
    WHERE fa.usuario_id = auth.uid()
  )
);

-- Escritura: solo staff (necesita curso_id en la misma institución)
CREATE POLICY "calificaciones_write" ON calificaciones
FOR ALL TO authenticated
USING (
  curso_id IN (
    SELECT c.id FROM cursos c
    WHERE c.institucion_id = (
      SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
    )
  )
)
WITH CHECK (
  curso_id IN (
    SELECT c.id FROM cursos c
    WHERE c.institucion_id = (
      SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
    )
  )
);


-- ── 3. periodos_intensificacion ───────────────────────────────────
ALTER TABLE periodos_intensificacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "periodos_intensif_select" ON periodos_intensificacion;
DROP POLICY IF EXISTS "periodos_intensif_write"  ON periodos_intensificacion;

CREATE POLICY "periodos_intensif_select" ON periodos_intensificacion
FOR SELECT TO authenticated
USING (
  institucion_id = (
    SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
  )
);

CREATE POLICY "periodos_intensif_write" ON periodos_intensificacion
FOR ALL TO authenticated
USING (
  institucion_id = (
    SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
  )
)
WITH CHECK (
  institucion_id = (
    SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
  )
);


-- ── 4. cierres_periodo ────────────────────────────────────────────
ALTER TABLE cierres_periodo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cierres_periodo_select" ON cierres_periodo;
DROP POLICY IF EXISTS "cierres_periodo_write"  ON cierres_periodo;

CREATE POLICY "cierres_periodo_select" ON cierres_periodo
FOR SELECT TO authenticated
USING (
  institucion_id = (
    SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
  )
);

CREATE POLICY "cierres_periodo_write" ON cierres_periodo
FOR ALL TO authenticated
USING (
  institucion_id = (
    SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
  )
)
WITH CHECK (
  institucion_id = (
    SELECT u.institucion_id FROM usuarios u WHERE u.id = auth.uid()
  )
);


-- ── 5. Recargar schema cache ──────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── FIN DE MIGRACIÓN v19 ──────────────────────────────────────────
