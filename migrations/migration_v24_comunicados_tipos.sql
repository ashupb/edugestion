-- ════════════════════════════════════════════════════════════════
-- v24 — Tipos de comunicados: novedad / comunicado + curso_id
-- Ejecutar en: Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1. Agregar curso_id para comunicados dirigidos a un curso específico
ALTER TABLE public.comunicados
  ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS comunicados_curso_idx
  ON public.comunicados(curso_id);

-- 2. Renombrar tipo existente: los comunicados actuales eran novedades institucionales
UPDATE public.comunicados SET tipo = 'novedad' WHERE tipo = 'institucional';

-- Resultado de valores de tipo:
--   'novedad'     → Novedades institucionales (con imágenes, por nivel, sin campana)
--   'comunicado'  → Comunicados por curso (sin fotos, con campana para familias)

NOTIFY pgrst, 'reload schema';
