// =====================================================
// OBJETIVOS.JS
// =====================================================

async function rObj() {
  showLoading('obj');
  try {
    const {data,error} = await sb.from('objetivos')
      .select('*')
      .eq('institucion_id',USUARIO_ACTUAL.institucion_id)
      .neq('estado','cerrado')
      .order('created_at',{ascending:false});
    if (error) throw error;
    window._objCache = data||[];

    const ok   = data.filter(o=>o.estado==='ok').length;
    const warn = data.filter(o=>o.estado==='warn').length;
    const risk = data.filter(o=>o.estado==='risk').length;
    const canEdit = ['directivo','admin'].includes(USUARIO_ACTUAL.rol);

    const c = document.getElementById('page-obj');
    c.innerHTML = `
      <div class="pg-t">Objetivos institucionales</div>
      <div class="pg-s">${INSTITUCION_ACTUAL?.nombre||''} · Ciclo lectivo ${new Date().getFullYear()}</div>
      <div class="metrics m3">
        <div class="mc"><div class="mc-v" style="color:var(--verde)">${ok}</div><div class="mc-l">En buen estado</div></div>
        <div class="mc"><div class="mc-v" style="color:var(--ambar)">${warn}</div><div class="mc-l">Requieren atención</div></div>
        <div class="mc"><div class="mc-v" style="color:var(--rojo)">${risk}</div><div class="mc-l">En riesgo</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="sec-lb" style="margin:0">Objetivos activos</div>
        ${canEdit?'<button class="btn-p" onclick="mostrarFormObj()">+ Nuevo objetivo</button>':''}
      </div>
      <div id="obj-lista">${renderListaObj(data||[])}</div>
      <div id="form-obj"></div>`;
  } catch(e) { showError('obj','Error: '+e.message); }
}

function renderListaObj(lista) {
  if (!lista.length) return '<div class="empty-state">🎯<br>No hay objetivos activos.</div>';
  return lista.map(obj => {
    const open = EX==='obj-'+obj.id;
    const clr  = obj.estado==='ok'?'var(--verde)':obj.estado==='warn'?'var(--ambar)':'var(--rojo)';
    const bg   = obj.estado==='ok'?'var(--verde-l)':obj.estado==='warn'?'var(--amb-l)':'var(--rojo-l)';
    const tg   = obj.estado==='ok'?'tg':obj.estado==='warn'?'ta':'tr';
    const tnd  = obj.tendencia==='bajando'?'↓':obj.tendencia==='subiendo'?'↑':'→';
    return `
      <div class="obj-c e${obj.estado[0]}">
        <div class="obj-top" onclick="togObj('obj-${obj.id}')">
          <div class="obj-icon" style="background:${bg}">${obj.icono||'🎯'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600">${obj.nombre}</div>
            <div style="font-size:10px;color:var(--txt2)">${obj.responsable_texto||'—'}</div>
            <div style="margin-top:6px">
              <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--txt3);margin-bottom:3px"><span>Cumplimiento</span><span>${obj.cumplimiento}%</span></div>
              <div class="bb"><div class="bf" style="width:${obj.cumplimiento}%;background:${clr}"></div></div>
            </div>
            <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">
              <span class="tag ${tg}">${obj.estado==='ok'?'En curso':obj.estado==='warn'?'Requiere atención':'En riesgo'}</span>
              <span class="tag tgr">${tnd} ${obj.tendencia}</span>
            </div>
          </div>
          <span style="font-size:11px;color:var(--txt2)">${open?'▲':'▼'}</span>
        </div>
        ${open?`<div id="det-obj-${obj.id}" class="obj-det"><div class="loading-state small"><div class="spinner"></div></div></div>`:''}
      </div>`;
  }).join('');
}

async function togObj(key) {
  togEx(key, ()=>{ const l=document.getElementById('obj-lista'); if(l) l.innerHTML=renderListaObj(window._objCache||[]); });
  if (EX===key) {
    const id=key.replace('obj-','');
    setTimeout(()=>cargarDetObj(id),50);
  }
}

async function cargarDetObj(objId) {
  const det = document.getElementById('det-obj-'+objId);
  if (!det) return;
  const obj = (window._objCache||[]).find(o=>o.id===objId);
  if (!obj) return;
  const {data:incs} = await sb.from('incidentes_objetivo')
    .select('*, usr:usuarios!incidentes_objetivo_registrado_por_fkey(nombre_completo)')
    .eq('objetivo_id',objId).order('created_at',{ascending:false}).limit(10);

  const clr  = obj.estado==='ok'?'var(--verde)':obj.estado==='warn'?'var(--ambar)':'var(--rojo)';
  const canEdit = ['directivo','admin'].includes(USUARIO_ACTUAL.rol);
  const incsHTML = (incs||[]).map(i=>`
    <div class="inc-row">
      <div class="inc-dot" style="background:${clr}"></div>
      <div style="flex:1"><div style="font-size:11px;font-weight:500">${i.descripcion_alumno||'—'} <span style="color:var(--txt2);font-weight:400">· ${i.curso_texto||''}</span></div>
      <div style="font-size:10px;color:var(--txt2)">${i.accion_tomada}</div>
      <div style="font-size:10px;color:var(--txt3)">${i.usr?.nombre_completo||'—'}</div></div>
      <div style="font-size:10px;color:var(--txt3)">${formatFechaCorta(i.created_at)}</div>
    </div>`).join('') || '<div style="font-size:11px;color:var(--txt2)">Sin incidentes aún.</div>';

  det.innerHTML = `
    <div style="padding:12px 14px">
      <div style="font-size:11px;color:var(--txt2);margin-bottom:8px">${obj.descripcion||''} ${obj.meta?'<br><b>Meta:</b> '+obj.meta:''}</div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <div class="ms"><div class="ms-v" style="color:${clr}">${incs?.length||0}</div><div class="ms-l">incidentes</div></div>
        <div class="ms"><div class="ms-v" style="color:var(--verde)">${obj.cumplimiento}%</div><div class="ms-l">cumplimiento</div></div>
      </div>
      ${incsHTML}
      ${canEdit?`
      <div style="margin-top:12px;border-top:1px solid var(--brd);padding-top:12px">
        <input type="text" id="ia-${objId}" placeholder="Alumno o 'Múltiples'" style="margin-bottom:6px">
        <input type="text" id="ic-${objId}" placeholder="Curso" style="margin-bottom:6px">
        <input type="text" id="icc-${objId}" placeholder="Acción tomada" style="margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <label style="font-size:11px;color:var(--txt2)">Nuevo cumplimiento %:</label>
          <input type="number" id="ip-${objId}" min="0" max="100" value="${obj.cumplimiento}" style="width:70px">
        </div>
        <div class="acc">
          <button class="btn-p" style="font-size:11px" onclick="guardarInc('${objId}')">Guardar incidente</button>
          <button class="btn-s" style="font-size:11px" onclick="cambEstObj('${objId}','ok')">✓ OK</button>
          <button class="btn-s" style="font-size:11px" onclick="cambEstObj('${objId}','warn')">⚠ Alerta</button>
          <button class="btn-d" style="font-size:11px" onclick="cambEstObj('${objId}','risk')">🔴 Riesgo</button>
        </div>
      </div>`:''}
    </div>`;
}

async function guardarInc(objId) {
  const a=document.getElementById('ia-'+objId)?.value.trim();
  const c=document.getElementById('ic-'+objId)?.value.trim();
  const ac=document.getElementById('icc-'+objId)?.value.trim();
  const pct=parseInt(document.getElementById('ip-'+objId)?.value)||0;
  if (!ac) { alert('Describí la acción tomada.'); return; }
  await sb.from('incidentes_objetivo').insert({objetivo_id:objId,registrado_por:USUARIO_ACTUAL.id,descripcion_alumno:a||null,curso_texto:c||null,accion_tomada:ac});
  await sb.from('objetivos').update({cumplimiento:Math.min(100,Math.max(0,pct)),updated_at:new Date().toISOString()}).eq('id',objId);
  await rObj();
}

async function cambEstObj(objId,estado) {
  const t=estado==='ok'?'bajando':estado==='risk'?'subiendo':'estable';
  await sb.from('objetivos').update({estado,tendencia:t,updated_at:new Date().toISOString()}).eq('id',objId);
  await rObj();
}

function mostrarFormObj() {
  const fc=document.getElementById('form-obj');
  if (fc.innerHTML){fc.innerHTML='';return;}
  fc.innerHTML=`
    <div class="card" style="margin-top:14px">
      <div style="font-size:14px;font-weight:600;margin-bottom:14px">Nuevo objetivo institucional</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input type="text" id="oi" value="🎯" style="width:50px;text-align:center;font-size:20px">
        <input type="text" id="on" placeholder="Nombre del objetivo" style="flex:1">
      </div>
      <textarea id="od" rows="2" placeholder="Descripción..."></textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <input type="text" id="or" placeholder="Responsable">
        <input type="text" id="om" placeholder="Meta medible">
      </div>
      <div class="acc" style="margin-top:14px">
        <button class="btn-p" onclick="guardarObj()">Crear objetivo</button>
        <button class="btn-s" onclick="document.getElementById('form-obj').innerHTML=''">Cancelar</button>
      </div>
    </div>`;
}

async function guardarObj() {
  const n=document.getElementById('on')?.value.trim();
  if (!n){alert('El nombre es obligatorio.');return;}
  const {error}=await sb.from('objetivos').insert({
    institucion_id:USUARIO_ACTUAL.institucion_id, creado_por:USUARIO_ACTUAL.id,
    nombre:n, icono:document.getElementById('oi')?.value||'🎯',
    descripcion:document.getElementById('od')?.value||null,
    responsable_texto:document.getElementById('or')?.value||null,
    meta:document.getElementById('om')?.value||null,
    estado:'ok', cumplimiento:0, tendencia:'estable'
  });
  if (error){alert('Error: '+error.message);return;}
  document.getElementById('form-obj').innerHTML='';
  await rObj();
}

// =====================================================
// EOE.JS
// =====================================================

async function rEOE() {
  showLoading('eoe');
  try {
    const {data,error}=await sb.from('problematicas')
      .select(`*, alumno:alumnos(nombre,apellido,curso:cursos(nombre,division))`)
      .eq('institucion_id',USUARIO_ACTUAL.institucion_id)
      .neq('estado','resuelta')
      .in('tipo',['emocional','familiar','salud'])
      .order('urgencia',{ascending:false});
    if (error) throw error;

    const c=document.getElementById('page-eoe');
    c.innerHTML=`
      <div class="pg-t">Equipo de orientación</div>
      <div class="pg-s">Casos con seguimiento especializado · ${INSTITUCION_ACTUAL?.nombre||''}</div>
      <div class="metrics m2">
        <div class="mc"><div class="mc-v" style="color:var(--rojo)">${(data||[]).filter(p=>p.urgencia==='alta').length}</div><div class="mc-l">Urgentes</div></div>
        <div class="mc"><div class="mc-v" style="color:var(--ambar)">${(data||[]).filter(p=>p.urgencia==='media').length}</div><div class="mc-l">Seguimiento</div></div>
      </div>
      ${!(data?.length)?'<div class="empty-state">🧠<br>Sin casos EOE activos</div>':
        data.map(p=>{
          const ini=(p.alumno?.apellido?.[0]||'?')+(p.alumno?.nombre?.[0]||'');
          const nom=p.alumno?`${p.alumno.apellido}, ${p.alumno.nombre}`:'—';
          const cur=p.alumno?.curso?`${p.alumno.curso.nombre}${p.alumno.curso.division||''}`:'—';
          return `
            <div class="caso-c u${p.urgencia?.[0]||'m'}" style="cursor:pointer" onclick="goPage('prob')">
              <div class="caso-top">
                <div class="av av32" style="background:var(--azul-l);color:var(--azul)">${ini}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:600">${nom}</div>
                  <div style="font-size:10px;color:var(--txt2)">${cur} · ${labelTipo(p.tipo)} · ${tiempoDesde(p.created_at)}</div>
                  <div style="margin-top:4px;display:flex;gap:4px">
                    <span class="tag ${p.urgencia==='alta'?'tr':'ta'}">Urgencia ${p.urgencia}</span>
                    <span class="tag td">Confidencial</span>
                  </div>
                </div>
                <span style="font-size:11px;color:var(--txt2)">›</span>
              </div>
            </div>`;
        }).join('')}`;
  } catch(e){showError('eoe','Error: '+e.message);}
}

// =====================================================
// ASISTENCIA.JS (Fase 2)
// =====================================================

async function rAsist() {
  document.getElementById('page-asist').innerHTML=`
    <div class="pg-t">Asistencia</div>
    <div class="pg-s">Disponible en Fase 2</div>
    <div class="empty-state">✅<br>Módulo de asistencia en construcción.<br>
    <span style="font-size:11px;color:var(--txt2)">Problemáticas, objetivos y reuniones ya están completamente funcionales.</span></div>`;
}

// NOTAS (Fase 2)
async function rNotas() {
  document.getElementById('page-notas').innerHTML=`
    <div class="pg-t">Calificaciones</div>
    <div class="pg-s">Disponible en Fase 2</div>
    <div class="empty-state">📊<br>Módulo de calificaciones en construcción.</div>`;
}