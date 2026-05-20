-- ═══════════════════════════════════════════════════════════════
-- Migration v31: Fix recursión infinita en RLS
--
-- Causa raíz:
--   migration_v30 creó policy en familia_alumno que hace JOIN en cursos.
--   Las policies de v19 (calificaciones_select, materias_estado_acceso)
--   ya consultaban familia_alumno. Esto formó la cadena:
--
--     calificaciones_select
--       → familia_alumno_select (v30)
--         → JOIN alumnos + cursos
--           → cursos RLS
--             → recursión infinita
--
--   El error se traga silenciosamente en auth.js de la app familias,
--   resultando en vinculos=null → ALUMNO_ACTUAL=null → "no tenés alumnos".
--
-- Fixes:
--   1. familia_alumno_select: reemplazar JOIN en cursos por subquery
--      directa en alumnos.institucion_id (sin tocar cursos).
--   2. cursos: resetear cualquier policy recursiva con una limpia.
--
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Fix policy familia_alumno ──────────────────────────────

DROP POLICY IF EXISTS "familia_alumno_select" ON public.familia_alumno;

-- Familias ven sus propios vínculos; staff ve los de su institución
-- Usa alumnos.institucion_id directamente — sin JOIN en cursos
-- para evitar la cadena recursiva a través de cursos RLS.
CREATE POLICY "familia_alumno_select" ON public.familia_alumno
  FOR SELECT TO authenticated
  USING (
    auth.uid() = usuario_id
    OR alumno_id IN (
      SELECT a.id FROM public.alumnos a
      WHERE a.institucion_id = (
        SELECT u.institucion_id FROM public.usuarios u WHERE u.id = auth.uid()
      )
    )
  );

-- ── 2. Fix cursos RLS ─────────────────────────────────────────
-- Eliminar todas las policies actuales de cursos (pueden ser recursivas)
-- y recrear una limpia que solo consulta usuarios.

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'cursos' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cursos', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "cursos_inst" ON public.cursos
  FOR ALL TO authenticated
  USING (
    institucion_id IN (
      SELECT u.institucion_id FROM public.usuarios u WHERE u.id = auth.uid()
    )
  )
  WITH CHECK (
    institucion_id IN (
      SELECT u.institucion_id FROM public.usuarios u WHERE u.id = auth.uid()
    )
  );

-- ── Recargar schema ───────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── FIN DE MIGRACIÓN v31 ──────────────────────────────────────
