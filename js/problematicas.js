// =====================================================
// PROBLEMATICAS.JS
// =====================================================

async function rProb() {
  showLoading('prob');
  try {
    const { data, error } = await sb
      .from('problematicas')
      .select(`*, alumno:alumnos(id,nombre,apellido,curso:cursos(nombre,division)),
               registrado_por_usuario:usuarios!problematicas_registrado_por_fkey(nombre_completo)`)
      .eq('institucion_id', USUARIO_ACTUAL.institucion_id)
      .neq('estado','resuelta')
      .order('urgencia', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    window._probCache = data || [];

    const abiertas = data.filter(p => p.estado === 'abierta').length;
    const enSeg    = data.filter(p => p.estado === 'en_seguimiento').length;

    const c = document.getElementById('page-prob');
    c.innerHTML = `
      <div class="pg-t">Problemáticas</div>
      <div class="pg-s">Seguimiento de situaciones · ${INSTITUCION_ACTUAL?.nombre || ''}</div>
      <div class="metrics m3">
        <div class="mc"><div class="mc-v" style="color:var(--rojo)">${abiertas}</div><div class="mc-l">Sin atender</div></div>
        <div class="mc"><div class="mc-v" style="color:var(--ambar)">${enSeg}</div><div class="mc-l">En seguimiento</div></div>
        <div class="mc"><div class="mc-v" style="color:var(--verde)">${data.filter(p=>p.estado==='derivada').length}</div><div class="mc-l">Derivadas</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="sec-lb" style="margin:0">Casos activos</div>
        <button class="btn-p" onclick="mostrarFormProb()">+ Registrar situación</button>
      </div>
      <div id="prob-lista">${renderListaProb(data || [])}</div>
      <div id="form-prob"></div>`;

  } catch (e) { showError('prob','Error: ' + e.message); }
}

function renderListaProb(lista) {
  if (!lista.length) return '<div class="empty-state">✅<br>No hay problemáticas activas</div>';
  return lista.map(p => {
    const open = EX === 'pr-' + p.id;
    const ini  = (p.alumno?.apellido?.[0]||'?') + (p.alumno?.nombre?.[0]||'');
    const nom  = p.alumno ? `${p.alumno.apellido}, ${p.alumno.nombre}` : '—';
    const cur  = p.alumno?.curso ? `${p.alumno.curso.nombre}${p.alumno.curso.division||''}` : '—';
    return `
      <div class="caso-c u${p.urgencia?.[0]||'m'}">
        <div class="caso-top" onclick="togProb('pr-${p.id}')">
          <div class="av av32" style="background:var(--rojo-l);color:var(--rojo)">${ini}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600">${nom}</div>
            <div style="font-size:10px;color:var(--txt2)">${cur} · ${labelTipo(p.tipo)} · ${tiempoDesde(p.created_at)}</div>
            <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
              <span class="tag ${p.urgencia==='alta'?'tr':p.urgencia==='media'?'ta':'tg'}">Urgencia ${p.urgencia}</span>
              <span class="tag ${labelEstadoCls(p.estado)}">${labelEstado(p.estado)}</span>
              ${p.confidencial?'<span class="tag td">Confidencial</span>':''}
            </div>
          </div>
          <span style="font-size:11px;color:var(--txt2)">${open?'▲':'▼'}</span>
        </div>
        ${open ? `<div id="det-${p.id}" class="caso-det"><div class="loading-state small"><div class="spinner"></div></div></div>` : ''}
      </div>`;
  }).join('');
}

async function togProb(key) {
  togEx(key, () => {
    const lista = document.getElementById('prob-lista');
    if (lista) lista.innerHTML = renderListaProb(window._probCache || []);
  });
  if (EX === key) {
    const probId = key.replace('pr-','');
    setTimeout(() => cargarDetProb(probId), 50);
  }
}

async function cargarDetProb(probId) {
  const det = document.getElementById('det-' + probId);
  if (!det) return;
  const { data: intvs } = await sb
    .from('intervenciones')
    .select('*, usr:usuarios!intervenciones_registrado_por_fkey(nombre_completo)')
    .eq('problematica_id', probId)
    .order('created_at', { ascending: false });

  const invsHTML = (intvs||[]).map(iv=>`
    <div class="tl-it">
      <div class="tl-d" style="background:var(--azul)"></div>
      <div class="tl-f">${formatFechaCorta(iv.created_at)}</div>
      <div><div class="tl-t">${iv.titulo}</div><div class="tl-ds">${iv.descripcion}</div>
      ${iv.proximo_paso?`<div style="font-size:10px;color:var(--verde);font-weight:500;margin-top:2px">→ ${iv.proximo_paso}</div>`:''}
      <div style="font-size:10px;color:var(--txt3)">${iv.usr?.nombre_completo||'—'}</div></div>
    </div>`).join('') || '<div style="font-size:11px;color:var(--txt2)">Sin intervenciones registradas.</div>';

  det.innerHTML = `
    <div style="padding:12px 14px">
      <div style="font-size:11px;color:var(--txt2);margin-bottom:10px;line-height:1.5">${(window._probCache||[]).find(p=>p.id===probId)?.descripcion||''}</div>
      <div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Intervenciones</div>
      ${invsHTML}
      <div style="margin-top:12px;border-top:1px solid var(--brd);padding-top:12px">
        <input type="text" id="it-${probId}" placeholder="Título de la intervención" style="margin-bottom:6px">
        <textarea id="id-${probId}" rows="2" placeholder="Descripción..."></textarea>
        <input type="text" id="ip-${probId}" placeholder="Próximo paso (opcional)" style="margin-top:6px;margin-bottom:8px">
        <div class="acc">
          <button class="btn-p" style="font-size:11px" onclick="guardarInterv('${probId}')">Guardar intervención</button>
          <button class="btn-d" style="font-size:11px" onclick="cambiarEstProb('${probId}','resuelta')">Cerrar caso ✓</button>
        </div>
      </div>
    </div>`;
}

async function guardarInterv(probId) {
  const t = document.getElementById('it-'+probId)?.value.trim();
  const d = document.getElementById('id-'+probId)?.value.trim();
  const p = document.getElementById('ip-'+probId)?.value.trim();
  if (!t||!d) { alert('Completá título y descripción.'); return; }
  const {error} = await sb.from('intervenciones').insert({
    problematica_id:probId, registrado_por:USUARIO_ACTUAL.id,
    titulo:t, descripcion:d, proximo_paso:p||null, tipo:'otro'
  });
  if (error) { alert('Error: '+error.message); return; }
  await sb.from('problematicas').update({estado:'en_seguimiento',updated_at:new Date().toISOString()}).eq('id',probId);
  await rProb();
}

async function cambiarEstProb(probId, estado) {
  await sb.from('problematicas').update({estado,updated_at:new Date().toISOString()}).eq('id',probId);
  await rProb();
}

function mostrarFormProb() {
  const fc = document.getElementById('form-prob');
  if (fc.innerHTML) { fc.innerHTML=''; return; }
  fc.innerHTML = `
    <div class="card" style="margin-top:14px">
      <div style="font-size:14px;font-weight:600;margin-bottom:14px">Registrar nueva situación</div>
      <div class="sec-lb">Alumno</div>
      <input type="text" id="pb-busq" placeholder="Apellido del alumno..." oninput="buscarAlProb(this.value)">
      <div id="pb-res"></div><input type="hidden" id="pb-id">
      <div class="sec-lb" style="margin-top:10px">Tipo</div>
      <div class="chip-row" id="pb-tipo">
        ${['convivencia','emocional','familiar','aprendizaje','salud','conducta'].map((t,i)=>
          `<div class="chip${i===0?' on':''}" onclick="document.querySelectorAll('#pb-tipo .chip').forEach(c=>c.classList.remove('on'));this.classList.add('on')">${labelTipo(t)}</div>`
        ).join('')}
      </div>
      <div class="sec-lb" style="margin-top:10px">Urgencia</div>
      <div class="urg-row">
        <div class="urg-b ua" data-u="alta"  onclick="selUrgProb(this)">Alta</div>
        <div class="urg-b um" data-u="media" onclick="selUrgProb(this)">Media</div>
        <div class="urg-b"   data-u="baja"  onclick="selUrgProb(this)">Baja</div>
      </div>
      <div class="sec-lb" style="margin-top:10px">Descripción</div>
      <textarea id="pb-desc" rows="3" placeholder="Describí lo observado..."></textarea>
      <div class="toggle-row-ui" style="margin-top:10px">
        <div><div style="font-size:12px;font-weight:500">Notificar al EOE</div><div style="font-size:10px;color:var(--txt2)">Alerta inmediata</div></div>
        <div class="tog on" id="pb-eoe" onclick="this.classList.toggle('on');this.classList.toggle('off')"><div class="tog-thumb"></div></div>
      </div>
      <div class="toggle-row-ui" style="margin-top:8px">
        <div><div style="font-size:12px;font-weight:500">Confidencial</div><div style="font-size:10px;color:var(--txt2)">Solo EOE y directivos</div></div>
        <div class="tog on" id="pb-conf" onclick="this.classList.toggle('on');this.classList.toggle('off')"><div class="tog-thumb"></div></div>
      </div>
      <div class="acc" style="margin-top:14px">
        <button class="btn-p" onclick="guardarProb()">Registrar y notificar</button>
        <button class="btn-s" onclick="document.getElementById('form-prob').innerHTML=''">Cancelar</button>
      </div>
    </div>`;
}

function selUrgProb(el) {
  el.closest('.urg-row').querySelectorAll('.urg-b').forEach(b=>b.className='urg-b');
  el.className = 'urg-b u' + el.dataset.u[0];
}

async function buscarAlProb(q) {
  const res = document.getElementById('pb-res');
  if (q.length < 2) { res.innerHTML=''; return; }
  const {data} = await sb.from('alumnos').select('id,nombre,apellido,curso:cursos(nombre,division)')
    .eq('institucion_id',USUARIO_ACTUAL.institucion_id)
    .or(`apellido.ilike.%${q}%,nombre.ilike.%${q}%`).limit(5);
  res.innerHTML = (data||[]).map(a=>`
    <div class="busqueda-resultado" onclick="document.getElementById('pb-id').value='${a.id}';document.getElementById('pb-busq').value='${a.apellido}, ${a.nombre}';document.getElementById('pb-res').innerHTML=''">
      ${a.apellido}, ${a.nombre} · ${a.curso?.nombre||''}${a.curso?.division||''}
    </div>`).join('') || '<div style="font-size:11px;color:var(--txt2);padding:6px">Sin resultados</div>';
}

async function guardarProb() {
  const alumnoId = document.getElementById('pb-id')?.value;
  const desc     = document.getElementById('pb-desc')?.value.trim();
  const tipoEl   = document.querySelector('#pb-tipo .chip.on');
  const urgEl    = document.querySelector('.urg-b.ua,.urg-b.um,.urg-b.ub');
  const eoe      = document.getElementById('pb-eoe')?.classList.contains('on');
  const conf     = document.getElementById('pb-conf')?.classList.contains('on');
  if (!alumnoId) { alert('Seleccioná un alumno.'); return; }
  if (!desc)     { alert('Escribí una descripción.'); return; }
  const tipo = { 'Convivencia':'convivencia','Emocional':'emocional','Familiar':'familiar','Aprendizaje':'aprendizaje','Salud':'salud','Conducta':'conducta' }[tipoEl?.textContent] || 'otro';
  const urg  = urgEl?.dataset.u || 'media';
  const {data:nueva,error} = await sb.from('problematicas').insert({
    institucion_id:USUARIO_ACTUAL.institucion_id, alumno_id:alumnoId,
    registrado_por:USUARIO_ACTUAL.id, tipo, urgencia:urg, descripcion:desc,
    notificar_eoe:eoe, confidencial:conf, estado:'abierta'
  }).select().single();
  if (error) { alert('Error: '+error.message); return; }
  if (eoe) {
    const {data:eoeUs} = await sb.from('usuarios').select('id').eq('institucion_id',USUARIO_ACTUAL.institucion_id).eq('rol','eoe');
    if (eoeUs?.length) await sb.from('notificaciones').insert(eoeUs.map(u=>({
      usuario_id:u.id, tipo:'nueva_problematica', titulo:'Nueva problemática registrada',
      descripcion:`Registrado por ${USUARIO_ACTUAL.nombre_completo}`,
      referencia_id:nueva.id, referencia_tabla:'problematicas'
    })));
  }
  document.getElementById('form-prob').innerHTML='';
  await rProb();
  cargarNotificaciones();
}