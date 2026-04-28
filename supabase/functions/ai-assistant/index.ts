import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function construirPromptLegajo(p: any): string {
  return `Sos un asistente especializado en gestión escolar argentina. 
Generá un resumen narrativo formal del siguiente alumno para uso interno del equipo docente.

Alumno: ${p.nombre}
Curso: ${p.curso}
Nivel: ${p.nivel}
Asistencia: ${p.porcentaje_asistencia}% (${p.dias_ausente} días ausente de ${p.dias_total})
Calificaciones: ${JSON.stringify(p.calificaciones)}
Intervenciones EOE: ${p.intervenciones || "Sin intervenciones registradas"}
Observaciones previas: ${p.observaciones || "Sin observaciones"}

Redactá un resumen en 3 párrafos: situación académica, situación de asistencia, y observaciones generales. 
Tono formal, objetivo, en español rioplatense. Máximo 200 palabras.`;
}

function construirPromptObservacion(p: any): string {
  return `Sos un asistente especializado en redacción pedagógica formal para escuelas argentinas.
Un docente escribió las siguientes notas informales sobre un alumno. Redactalas como una observación pedagógica formal para el legajo escolar.

Docente: ${p.docente}
Materia: ${p.materia}
Alumno: ${p.alumno}
Período: ${p.periodo}
Notas del docente: "${p.notas_docente}"

Redactá una observación pedagógica formal en 2-3 oraciones. 
Tono profesional, objetivo, en español rioplatense. Empezá directamente con la observación, sin encabezado.`;
}

function construirPromptAlerta(p: any): string {
  return `Sos un asistente de análisis escolar. Analizá la situación del siguiente alumno y generá una alerta contextualizada con sugerencia de acción.

Alumno: ${p.nombre}
Curso: ${p.curso}
Asistencia actual: ${p.porcentaje_asistencia}%
Tendencia asistencia: ${p.tendencia_asistencia}
Promedio general: ${p.promedio_general}
Materias con bajo rendimiento: ${p.materias_bajas || "ninguna"}
Intervenciones previas: ${p.intervenciones || "ninguna"}

Generá un análisis breve (máximo 3 oraciones) que describa la situación y sugiera una acción concreta (ej: "Se sugiere contactar a la familia", "Se recomienda derivación EOE", etc.).
Tono directo y profesional.`;
}

function construirPromptAnalisis(p: any): string {
  return `Sos un asistente de gestión institucional escolar argentina. 
Generá un análisis ejecutivo del estado institucional del mes para el equipo directivo.

Institución: ${p.institucion}
Período: ${p.periodo}
Total alumnos: ${p.total_alumnos}
Asistencia promedio institucional: ${p.asistencia_promedio}%
Cursos con mayor ausentismo: ${p.cursos_ausentismo || "sin datos"}
Promedio general de calificaciones: ${p.promedio_calificaciones}
Materias con más bajas notas: ${p.materias_bajas || "sin datos"}
Incidentes registrados: ${p.incidentes || 0}
Intervenciones EOE activas: ${p.intervenciones_activas || 0}

Redactá un resumen ejecutivo en 3 párrafos: situación académica general, situación de asistencia, y aspectos a atender con urgencia.
Tono formal, directo, en español rioplatense. Máximo 250 palabras.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_KEY) {
      throw new Error("API key no configurada");
    }

    let prompt = "";
    if (action === "sintesis_legajo") {
      prompt = construirPromptLegajo(payload);
    } else if (action === "observacion_pedagogica") {
      prompt = construirPromptObservacion(payload);
    } else if (action === "alerta_contexto") {
      prompt = construirPromptAlerta(payload);
    } else if (action === "analisis_institucional") {
      prompt = construirPromptAnalisis(payload);
    } else {
      throw new Error("Acción no reconocida");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Error en API de Anthropic");
    }

    return new Response(
      JSON.stringify({ result: data.content[0].text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});