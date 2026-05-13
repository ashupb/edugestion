// ── Constantes de presentación ────────────────────────────────────────
const _ESTADO_CLR = {
  cursando:          '#3b82f6',
  pendiente_intensif:'#f59e0b',
  intensificando:    '#f59e0b',
  recursando:        '#ef4444',
  aprobada:          '#16a34a',
  desaprobada:       '#ef4444',
  a_recursar:        '#ef4444',
};
const _ESTADO_LBL = {
  cursando:          'Cursando',
  pendiente_intensif:'Pend. intensif.',
  intensificando:    'Intensificando',
  recursando:        'Recursando',
  aprobada:          'Aprobada',
  desaprobada:       'Desaprobada',
  a_recursar:        'A recursar',
};
const _PERIODO_LBL = {
  inicio_c1: '1° cuat.',
  fin_c1:    '2° cuat.',
  diciembre: 'Dic.',
  febrero:   'Feb.',
};

// ── Renderer principal ────────────────────────────────────────────────
async function rSeguimiento() {
  showLoading('seguimiento');
  const el = document.getElementById('page-seguimiento');

  if (!ALUMNO_ACTUAL) {
    el.innerHTML = `
      <div class="page-body">
        <div class="alert-card alert-warning">
          <p>No hay alumno seleccionado.</p>
        </div>
      </div>`;
    return;
  }

  const alumnoId = ALUMNO_ACTUAL.id;

  try {
    const [trayRes, califRes, asistRes] = await Promise.all([
      // Estado de cada materia por ciclo lectivo
      sb.from('materias_estado_alumno')
        .select('estado,ciclo_lectivo_origen,ciclo_lectivo_cursado,nota_final,nota_intensif_1,nota_intensif_2,materia_id,materias(nombre),periodos_intensificacion(nombre,tipo)')
        .eq('alumno_id', alumnoId)
        .order('ciclo_lectivo_origen', { ascending: false }),

      // Calificaciones individuales con datos del período
      sb.from('calificaciones')
        .select('nota,ausente,materia_id,periodos_intensificacion(ciclo_lectivo,tipo)')
        .eq('alumno_id', alumnoId)
        .not('nota', 'is', null)
        .eq('ausente', false),

      // Asistencia para calcular % por año
      sb.from('asistencia')
        .select('fecha,estado')
        .eq('alumno_id', alumnoId),
    ]);

    const tray   = trayRes.data  || [];
    const califs = califRes.data || [];
    const asist  = asistRes.data || [];

    if (!tray.length) {
      el.innerHTML = `
        <div class="page-body">
          <div class="page-header"><h1 class="page-title">Trayectoria</h1></div>
          <div class="card"><p class="empty-msg">Sin trayectoria académica registrada aún.</p></div>
        </div>`;
      return;
    }

    // Asistencia por año (clave: "2025", etc.)
    const asistPorAnio = {};
    asist.forEach(a => {
      const anio = a.fecha?.slice(0, 4);
      if (!anio) return;
      if (!asistPorAnio[anio]) asistPorAnio[anio] = { total: 0, presentes: 0 };
      asistPorAnio[anio].total++;
      if (['presente', 'tardanza', 'media_falta'].includes(a.estado)) {
        asistPorAnio[anio].presentes++;
      }
    });

    // Calificaciones agrupadas por "materia_id-ciclo_lectivo-tipo_periodo"
    const califsPorKey = {};
    califs.forEach(c => {
      const anio = c.periodos_intensificacion?.ciclo_lectivo;
      const tipo = c.periodos_intensificacion?.tipo;
      if (!anio || !tipo || !c.materia_id) return;
      const key = `${c.materia_id}-${anio}-${tipo}`;
      if (!califsPorKey[key]) califsPorKey[key] = [];
      califsPorKey[key].push(Number(c.nota));
    });

    // Trayectoria agrupada por ciclo lectivo de origen
    const porCiclo = {};
    tray.forEach(r => {
      const k = r.ciclo_lectivo_origen;
      if (!porCiclo[k]) porCiclo[k] = [];
      porCiclo[k].push(r);
    });

    // Materias con acreditación pendiente
    const pendientes = tray.filter(r =>
      ['pendiente_intensif', 'intensificando', 'recursando', 'a_recursar'].includes(r.estado)
    );

    el.innerHTML = `
      <div class="page-body">
        <div class="page-header">
          <h1 class="page-title">Trayectoria</h1>
        </div>
        ${pendientes.length ? _seguimientoPendientes(pendientes) : ''}
        ${Object.entries(porCiclo)
            .sort((a, b) => b[0] - a[0])
            .map(([ciclo, registros]) =>
              _seguimientoCicloCard(+ciclo, registros, califsPorKey, asistPorAnio)
            ).join('')}
      </div>`;

  } catch (e) {
    console.error('seguimiento:', e);
    el.innerHTML = `
      <div class="page-body">
        <div class="alert-card alert-danger">
          <p>No se pudo cargar la trayectoria. Intentá de nuevo más tarde.</p>
        </div>
      </div>`;
  }
}

// ── Card de materias pendientes ───────────────────────────────────────
function _seguimientoPendientes(pendientes) {
  return `
    <div class="card" style="border-left:3px solid #ef4444">
      <div class="card-header">
        <span class="card-label" style="color:#ef4444">⚠ PENDIENTE DE ACREDITACIÓN (${pendientes.length})</span>
      </div>
      <div class="list-items">
        ${pendientes.map(r => `
          <div class="list-item">
            <div class="list-dot" style="background:#ef4444;flex-shrink:0"></div>
            <div class="list-item-body">
              <p class="list-item-title">${r.materias?.nombre || '—'}</p>
              <p class="list-item-meta">Ciclo ${r.ciclo_lectivo_origen}
                ${r.ciclo_lectivo_cursado !== r.ciclo_lectivo_origen
                  ? ` · resolviendo en ${r.ciclo_lectivo_cursado}` : ''}
              </p>
            </div>
            <span class="badge badge-warning">${_ESTADO_LBL[r.estado] || r.estado}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ── Card por ciclo lectivo ────────────────────────────────────────────
function _seguimientoCicloCard(ciclo, registros, califsPorKey, asistPorAnio) {
  const asistAnio = asistPorAnio[String(ciclo)];
  const pct = asistAnio?.total > 0
    ? Math.round(asistAnio.presentes / asistAnio.total * 100)
    : null;
  const pctClr = pct === null ? '' : pct >= 85 ? '#16a34a' : pct >= 75 ? '#f59e0b' : '#ef4444';

  const aprobadas    = registros.filter(r => r.estado === 'aprobada').length;
  const desaprobadas = registros.filter(r => ['desaprobada', 'a_recursar'].includes(r.estado)).length;
  const enCurso      = registros.filter(r => r.estado === 'cursando').length;
  const enPendiente  = registros.filter(r =>
    ['pendiente_intensif', 'intensificando', 'recursando'].includes(r.estado)
  ).length;

  const chips = [
    aprobadas   ? `<span class="seg-chip seg-chip--verde">${aprobadas} aprobada${aprobadas   !== 1 ? 's' : ''}</span>` : '',
    desaprobadas ? `<span class="seg-chip seg-chip--rojo">${desaprobadas} desaprobada${desaprobadas !== 1 ? 's' : ''}</span>` : '',
    enPendiente  ? `<span class="seg-chip seg-chip--ambar">${enPendiente} pendiente${enPendiente  !== 1 ? 's' : ''}</span>` : '',
    enCurso      ? `<span class="seg-chip seg-chip--azul">${enCurso} en curso</span>` : '',
  ].filter(Boolean).join('');

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-label">CICLO ${ciclo}</span>
        ${pct !== null
          ? `<span style="font-size:11px;font-weight:700;color:${pctClr}">${pct}% asistencia</span>`
          : ''}
      </div>
      ${chips ? `<div class="seg-chips">${chips}</div>` : ''}
      <div class="list-items" style="margin-top:8px">
        ${registros
            .slice()
            .sort((a, b) => (a.materias?.nombre || '').localeCompare(b.materias?.nombre || ''))
            .map(r => _seguimientaMateriaRow(r, ciclo, califsPorKey))
            .join('')}
      </div>
    </div>`;
}

// ── Fila por materia ──────────────────────────────────────────────────
function _seguimientaMateriaRow(r, ciclo, califsPorKey) {
  const clr = _ESTADO_CLR[r.estado] || '#6b7280';

  // Promedio de calificaciones por período (cuatrimestrales + intensif)
  const periodoChips = Object.entries(_PERIODO_LBL)
    .map(([tipo, lbl]) => {
      const key   = `${r.materia_id}-${ciclo}-${tipo}`;
      const notas = califsPorKey[key];
      if (!notas?.length) return null;
      const avg = notas.reduce((a, b) => a + b, 0) / notas.length;
      return `<span style="font-size:10px;color:#6b7280">${lbl}: ${_fmtNota(avg)}</span>`;
    })
    .filter(Boolean);

  const notasFinales = [
    r.nota_final      != null ? `<span style="font-size:10px;color:#6b7280">Final: ${_fmtNota(r.nota_final)}</span>`       : null,
    r.nota_intensif_1 != null ? `<span style="font-size:10px;color:#6b7280">Intens. 1: ${_fmtNota(r.nota_intensif_1)}</span>` : null,
    r.nota_intensif_2 != null ? `<span style="font-size:10px;color:#6b7280">Intens. 2: ${_fmtNota(r.nota_intensif_2)}</span>` : null,
    r.ciclo_lectivo_cursado !== r.ciclo_lectivo_origen
      ? `<span style="font-size:10px;color:#9ca3af">Resuelve en ${r.ciclo_lectivo_cursado}</span>` : null,
  ].filter(Boolean);

  const detalles = [...periodoChips, ...notasFinales];

  return `
    <div class="list-item" style="align-items:flex-start">
      <div class="list-item-body" style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <p class="list-item-title" style="flex:1;min-width:0">${r.materias?.nombre || '—'}</p>
          <span style="font-size:10px;font-weight:700;color:${clr};white-space:nowrap;flex-shrink:0">
            ${_ESTADO_LBL[r.estado] || r.estado}
          </span>
        </div>
        ${detalles.length
          ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:3px">${detalles.join('')}</div>`
          : ''}
      </div>
    </div>`;
}

// ── Helper: nota coloreada ────────────────────────────────────────────
function _fmtNota(n) {
  if (n == null) return '<span style="color:#9ca3af">—</span>';
  const clr = n >= 7 ? '#16a34a' : n >= 4 ? '#d97706' : '#dc2626';
  const val = Number.isInteger(n) ? n : parseFloat(n.toFixed(1));
  return `<span style="font-weight:700;color:${clr}">${val}</span>`;
}
