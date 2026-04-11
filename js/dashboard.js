// =====================================================
// DASHBOARD.JS — versión corregida
// =====================================================

async function rDash() {
  const c = document.getElementById('page-dash');
  if (!c) return;

  c.innerHTML = '<div class="loading-state"><div class="spinner"></div><div>Cargando...</div></div>';

  try {
    const instId = USUARIO_ACTUAL && USUARIO_ACTUAL.institucion_id;
    if (!instId) {
      c.innerHTML = '<div class="empty-state">⚠️<br>No se encontró la institución del usuario.<br><small>Revisá la consola (F12).</small></div>';
      return;
    }

    const { data: probs, error: e1 } = await sb.from('problematicas').select('id,urgencia,estado').eq('institucion_id', instId).neq('estado','resuelta');
    if (e1) console.error('Error problemáticas:', e1.message);

    const { data: objs, error: e2 } = await sb.from('objetivos').select('id,nombre,estado,icono,cumplimiento').eq('institucion_id', instId).neq('estado','cerrado');
    if (e2) console.error('Error objetivos:', e2.message);

    const { data: reus, error: e3 } = await sb.from('reuniones').select('id,titulo,fecha,hora,lugar').eq('institucion_id', instId).gte('fecha', new Date().toISOString().split('T')[0]).order('fecha').limit(4);
    if (e3) console.error('Error reuniones:', e3.message);

    const problemas = probs || [];
    const objetivos = objs  || [];
    const reuniones = reus  || [];

    const probUrgentes = problemas.filter(function(p){ return p.urgencia === 'alta'; }).length;
    const objRiesgo    = objetivos.filter(function(o){ return o.estado === 'risk'; }).length;

    var hora   = new Date().getHours();
    var saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    var nombre = (USUARIO_ACTUAL.nombre_completo || '').split(',')[0].trim();
    var inst   = (INSTITUCION_ACTUAL && INSTITUCION_ACTUAL.nombre) || 'EduGestión';
    var hoy    = new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });

    var html = '<div class="pg-t">' + saludo + ', ' + nombre + ' 👋</div>';
    html += '<div class="pg-s" style="text-transform:capitalize">' + hoy + ' · ' + inst + '</div>';

    if (probUrgentes > 0) {
      html += '<div class="alr" style="cursor:pointer" onclick="goPage(\'prob\')">';
      html += '<div class="alr-t">⚠️ ' + probUrgentes + ' problemática' + (probUrgentes > 1 ? 's' : '') + ' de urgencia alta</div>';
      html += '<div class="alr-d">Requieren intervención inmediata.</div></div>';
    }

    if (objRiesgo > 0) {
      html += '<div class="alr" style="background:var(--amb-l);border-color:var(--ambar);cursor:pointer" onclick="goPage(\'obj\')">';
      html += '<div class="alr-t" style="color:var(--ambar)">🎯 ' + objRiesgo + ' objetivo' + (objRiesgo > 1 ? 's' : '') + ' en riesgo</div>';
      html += '<div class="alr-d" style="color:#856404">Revisá los objetivos institucionales.</div></div>';
    }

    html += '<div class="metrics m3">';
    html += '<div class="mc" style="cursor:pointer" onclick="goPage(\'prob\')"><div class="mc-v" style="color:' + (problemas.length > 0 ? 'var(--rojo)' : 'var(--verde)') + '">' + problemas.length + '</div><div class="mc-l">Problemáticas activas</div></div>';
    html += '<div class="mc" style="cursor:pointer" onclick="goPage(\'obj\')"><div class="mc-v" style="color:' + (objRiesgo > 0 ? 'var(--rojo)' : 'var(--verde)') + '">' + objetivos.length + '</div><div class="mc-l">Objetivos activos</div></div>';
    html += '<div class="mc" style="cursor:pointer" onclick="goPage(\'reuniones\')"><div class="mc-v">' + reuniones.length + '</div><div class="mc-l">Reuniones próximas</div></div>';
    html += '</div>';

    if (objetivos.length > 0) {
      html += '<div class="sec-lb">Objetivos — estado actual</div><div class="card" style="padding:0">';
      objetivos.forEach(function(o) {
        var clr = o.estado === 'ok' ? 'var(--verde)' : o.estado === 'warn' ? 'var(--ambar)' : 'var(--rojo)';
        var bg  = o.estado === 'ok' ? 'var(--verde-l)' : o.estado === 'warn' ? 'var(--amb-l)' : 'var(--rojo-l)';
        var lbl = o.estado === 'ok' ? 'En curso' : o.estado === 'warn' ? 'Atención' : 'En riesgo';
        html += '<div class="row-it" style="padding:10px 14px" onclick="goPage(\'obj\')">';
        html += '<div style="width:32px;height:32px;border-radius:8px;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' + (o.icono || '🎯') + '</div>';
        html += '<div style="flex:1;font-size:12px;font-weight:500">' + o.nombre + '</div>';
        html += '<span style="font-size:10px;font-weight:500;padding:2px 8px;border-radius:20px;background:' + bg + ';color:' + clr + '">' + lbl + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    if (reuniones.length > 0) {
      html += '<div class="sec-lb">Próximas reuniones</div><div class="card">';
      reuniones.forEach(function(r) {
        html += '<div class="tl-it" style="cursor:pointer" onclick="goPage(\'reuniones\')">';
        html += '<div class="tl-d" style="background:var(--verde)"></div>';
        html += '<div class="tl-f">' + formatFecha(r.fecha) + '</div>';
        html += '<div><div class="tl-t">' + r.titulo + '</div>';
        html += '<div class="tl-ds">' + (r.hora || '') + (r.lugar ? ' · ' + r.lugar : '') + '</div></div></div>';
      });
      html += '</div>';
    }

    html += '<div class="sec-lb">Acceso rápido</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    html += '<div class="card" style="cursor:pointer;text-align:center;padding:16px" onclick="goPage(\'prob\')"><div style="font-size:24px;margin-bottom:6px">⚠️</div><div style="font-size:12px;font-weight:500">Registrar situación</div></div>';
    html += '<div class="card" style="cursor:pointer;text-align:center;padding:16px" onclick="goPage(\'reuniones\')"><div style="font-size:24px;margin-bottom:6px">🤝</div><div style="font-size:12px;font-weight:500">Nueva reunión</div></div>';
    html += '<div class="card" style="cursor:pointer;text-align:center;padding:16px" onclick="goPage(\'obj\')"><div style="font-size:24px;margin-bottom:6px">🎯</div><div style="font-size:12px;font-weight:500">Ver objetivos</div></div>';
    html += '<div class="card" style="cursor:pointer;text-align:center;padding:16px" onclick="goPage(\'leg\')"><div style="font-size:24px;margin-bottom:6px">🗂️</div><div style="font-size:12px;font-weight:500">Buscar alumno</div></div>';
    html += '</div>';

    c.innerHTML = html;

  } catch (err) {
    console.error('Error en rDash:', err);
    c.innerHTML = '<div class="empty-state">⚠️<br>Error: ' + err.message + '</div>';
  }
}