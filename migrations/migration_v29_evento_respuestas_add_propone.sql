-- ═══════════════════════════════════════════════════════════════
-- Migration v29: Agregar 'propone' al CHECK constraint de evento_respuestas
--
-- La constraint evento_respuestas_respuesta_check solo permite
-- ('acepta','rechaza','cancela'). Hay que agregar 'propone' para
-- el flujo de propuesta de otro horario desde el portal de familias.
--
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Los datos existentes usaban formato largo ('aceptada', 'pendiente').
-- El código actual usa formato corto ('acepta', 'rechaza', 'cancela', 'propone').
-- Esta migración normaliza los datos y actualiza la constraint.

-- Migrar 'aceptada' al formato nuevo
UPDATE public.evento_respuestas SET respuesta = 'acepta'   WHERE respuesta = 'aceptada';
UPDATE public.evento_respuestas SET respuesta = 'rechaza'  WHERE respuesta = 'rechazada';
UPDATE public.evento_respuestas SET respuesta = 'cancela'  WHERE respuesta = 'cancelada';

-- Borrar filas 'pendiente' (pendiente = sin fila en la tabla, no se almacena)
DELETE FROM public.evento_respuestas WHERE respuesta = 'pendiente';

-- Eliminar constraint vieja
ALTER TABLE public.evento_respuestas
  DROP CONSTRAINT IF EXISTS evento_respuestas_respuesta_check;

-- Recrear con todos los valores nuevos
ALTER TABLE public.evento_respuestas
  ADD CONSTRAINT evento_respuestas_respuesta_check
  CHECK (respuesta IN ('acepta', 'rechaza', 'cancela', 'propone'));

-- ── FIN DE MIGRACIÓN v29 ──────────────────────────────────────────
