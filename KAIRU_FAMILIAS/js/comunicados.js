// =====================================================
// COMUNICADOS.JS — Comunicados por curso (familias)
// Solo texto, con notificación de campana
// =====================================================

let _COM_DATA = [];

async function rComunicados() {
  showLoading('comunicados');
  const el = document.getElementById('page-comunicados');

  const cursoId = ALUMNO_ACTUAL?.cursos?.id;

  try {
    if (!cursoId) {
      el.innerHTML = `
        <div class="page-body">
          <div class="page-header"><h1 class="page-title">Comunicados</h1></div>
          <div class="card"><p class="empty-msg">No hay información del curso del alumno.</p></div>
        </div>`;
      return;
    }

    const { data, error } = await sb
      .from('comunicados')
      .select('id, titulo, cuerpo, created_at, usuarios(nombre_completo), cursos(id, nombre, division, nivel)')
      .eq('institucion_id', USUARIO_FAMILIAR.institucion_id)
      .eq('tipo', 'comunicado')
      .eq('curso_id', cursoId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    _COM_DATA = data || [];

    // Lecturas previas
    let leidosIds = new Set();
    if (_COM_DATA.length) {
      const { data: lecturas } = await sb
        .from('comunicado_lecturas')
        .select('comunicado_id')
        .eq('usuario_id', USUARIO_FAMILIAR.id)
        .in('comunicado_id', _COM_DATA.map(c => c.id));
      leidosIds = new Set((lecturas || []).map(l => l.comunicado_id));
    }

    el.innerHTML = `
      <div class="page-body">
        <div class="page-header">
          <h1 class="page-title">Comunicados</h1>
        </div>
        ${_COM_DATA.length === 0
          ? `<div class="card"><p class="empty-msg">No hay comunicados del curso aún.</p></div>`
          : _COM_DATA.map(c => _comCardText(c, leidosIds)).join('')
        }
      </div>`;

    // Marcar como leídos → actualiza campana
    const noLeidos = _COM_DATA.filter(c => !leidosIds.has(c.id));
    if (noLeidos.length) {
      await sb.from('comunicado_lecturas').upsert(
        noLeidos.map(c => ({ comunicado_id: c.id, usuario_id: USUARIO_FAMILIAR.id })),
        { onConflict: 'comunicado_id,usuario_id' }
      );
      fetchUnreadCount();
    }

  } catch (e) {
    el.innerHTML = `
      <div class="page-body">
        <div class="alert-card alert-danger">
          <p>No se pudieron cargar los comunicados. Intentá de nuevo.</p>
        </div>
      </div>`;
  }
}

function _comCardText(c, leidosIds) {
  const sinLeer = !leidosIds.has(c.id);
  const cur = c.cursos;
  const cursoTxt = cur
    ? `${cur.nombre}${cur.division ? ' ' + cur.division : ''}`
    : 'Comunicado';
  const autor = c.usuarios?.nombre_completo || '';

  return `
    <div class="card com-text-card${sinLeer ? ' com-card--unread' : ''}">
      <div class="com-meta" style="margin-bottom:8px">
        <span class="badge badge-com">${cursoTxt}</span>
        ${sinLeer ? '<span class="com-new-dot"></span>' : ''}
        <span class="com-fecha">${fechaRelativa(c.created_at)}</span>
      </div>
      <p class="com-titulo">${c.titulo}</p>
      ${c.cuerpo ? `<p class="com-text-cuerpo">${c.cuerpo.replace(/\n/g, '<br>')}</p>` : ''}
      ${autor ? `<p class="com-autor" style="margin-top:10px">— ${autor}</p>` : ''}
    </div>`;
}
