-- ═══════════════════════════════════════════════════════════════
-- Migration v28: RLS explícito para evento_respuestas
--
-- La tabla evento_respuestas puede tener RLS activado pero sin
-- políticas que permitan a familias insertar/actualizar sus RSVP.
-- Esta migración habilita RLS y crea las políticas explícitamente.
--
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS (idempotente)
ALTER TABLE public.evento_respuestas ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores que puedan existir
DROP POLICY IF EXISTS familiar_rsvp_select ON public.evento_respuestas;
DROP POLICY IF EXISTS familiar_rsvp_insert ON public.evento_respuestas;
DROP POLICY IF EXISTS familiar_rsvp_update ON public.evento_respuestas;
DROP POLICY IF EXISTS "familiar_rsvp_select" ON public.evento_respuestas;
DROP POLICY IF EXISTS "familiar_rsvp_insert" ON public.evento_respuestas;
DROP POLICY IF EXISTS "familiar_rsvp_update" ON public.evento_respuestas;

-- SELECT: propias filas O staff del evento (convocados + creador)
CREATE POLICY "familiar_rsvp_select" ON public.evento_respuestas
FOR SELECT TO authenticated
USING (
  auth.uid() = usuario_id
  OR EXISTS (
    SELECT 1 FROM public.eventos_institucionales e
    WHERE e.id = evento_id
      AND (
        e.creado_por = auth.uid()
        OR auth.uid() = ANY(COALESCE(e.convocados_ids, '{}'))
        OR auth.uid() = ANY(COALESCE(e.responsables_ids, '{}'))
      )
  )
);

-- INSERT: solo puede insertar su propia fila
CREATE POLICY "familiar_rsvp_insert" ON public.evento_respuestas
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- UPDATE: solo puede actualizar su propia fila
CREATE POLICY "familiar_rsvp_update" ON public.evento_respuestas
FOR UPDATE TO authenticated
USING (auth.uid() = usuario_id);

-- Recargar schema de PostgREST
NOTIFY pgrst, 'reload schema';

-- ── FIN DE MIGRACIÓN v28 ──────────────────────────────────────────
