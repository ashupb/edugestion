// =====================================================
// MAIN.JS — Arranque y navegación
// =====================================================

let PAGE_HIST = [];
let CUR_PAGE  = 'dash';
let DARK      = false;
let SB_OPEN   = true;
let EX        = null;

const PAGE_LABELS = {
  dash:      'Inicio',
  prob:      'Problemáticas',
  obj:       'Objetivos institucionales',
  reuniones: 'Reuniones y actividades',
  asist:     'Asistencia',
  notas:     'Calificaciones',
  leg:       'Legajos',
  eoe:       'Equipo de orientación',
  admin:     'Datos institucionales',
};

// ── ARRANQUE ─────────────────────────────────────────
async function iniciarApp() {
  // Ocultar login, mostrar shell
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('shell').style.display        = 'flex';

  // Nombre e iniciales del usuario en sidebar
  const u       = USUARIO_ACTUAL;
  const iniciales = u.avatar_iniciales || generarIniciales(u.nombre_completo);
  document.getElementById('sb-av').textContent    = iniciales.toUpperCase();
  document.getElementById('sb-nombre').textContent = u.nombre_completo;
  document.getElementById('sb-rol').textContent    = labelRol(u.rol);

  // Nombre de la institución en sidebar — genérico, se carga de la BD
  const instNombre = INSTITUCION_ACTUAL?.nombre || 'EduGestión';
  const instLetra  = instNombre[0]?.toUpperCase() || 'E';
  document.getElementById('sb-inst-logo').textContent  = instLetra;
  document.getElementById('sb-inst-nombre').textContent = instNombre;

  // Título de la pestaña del navegador
  document.title = instNombre + ' · EduGestión';

  iniciarReloj();
  renderNav();
  cargarNotificaciones();
  await goPage('dash');
}

// ── NAVEGACIÓN ────────────────────────────────────────
async function goPage(id) {
  if (CUR_PAGE !== id) PAGE_HIST.push(CUR_PAGE);
  CUR_PAGE = id;
  EX = null;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('on');

  document.getElementById('tb-title').textContent = PAGE_LABELS[id] || id;

  const back = document.getElementById('tb-back');
  back.classList.toggle('show', PAGE_HIST.length > 0);

  renderNav();

  const renderers = {
    dash:      rDash,
    prob:      rProb,
    obj:       rObj,
    reuniones: rReuniones,
    asist:     rAsist,
    leg:       rLeg,
    eoe:       rEOE,
    admin:     rAdmin,
  };
  if (renderers[id]) await renderers[id]();
}

function goBack() {
  if (PAGE_HIST.length > 0) {
    const prev = PAGE_HIST.pop();
    CUR_PAGE = prev;
    EX = null;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    const pg = document.getElementById('page-' + prev);
    if (pg) pg.classList.add('on');
    document.getElementById('tb-title').textContent = PAGE_LABELS[prev] || prev;
    document.getElementById('tb-back').classList.toggle('show', PAGE_HIST.length > 0);
    renderNav();
    const renderers = { dash:rDash,prob:rProb,obj:rObj,reuniones:rReuniones,asist:rAsist,leg:rLeg,eoe:rEOE,admin:rAdmin };
    if (renderers[prev]) renderers[prev]();
  }
}

// ── UI CONTROLS ───────────────────────────────────────
function toggleSidebar() {
  SB_OPEN = !SB_OPEN;
  document.getElementById('sidebar').classList.toggle('collapsed', !SB_OPEN);
}

function toggleDark() {
  DARK = !DARK;
  document.body.classList.toggle('dark', DARK);
  const icon = DARK ? '☀️' : '🌙';
  document.getElementById('theme-icon').textContent    = icon;
  document.getElementById('tb-theme-icon').textContent = icon;
  document.getElementById('dark-label').textContent    = DARK ? 'Modo claro' : 'Modo oscuro';
}

function togEx(id, fn) {
  EX = EX === id ? null : id;
  if (fn) fn();
}

// ── RELOJ ─────────────────────────────────────────────
function iniciarReloj() {
  function tick() {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const el  = document.getElementById('tb-clock');
    if (el) el.textContent = h + ':' + m;
  }
  tick();
  setInterval(tick, 30000);
}

// ── UTILIDADES GLOBALES ───────────────────────────────
function labelRol(rol) {
  return { directivo:'Directivo/a', eoe:'Orientador/a EOE', docente:'Docente', preceptor:'Preceptor/a', admin:'Admin' }[rol] || rol;
}

function generarIniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0][0];
  // Apellido, Nombre → toma primera letra de cada parte
  return (partes[0][0] + (partes[1]?.[0] || '')).toUpperCase();
}

function PC(p) { return p >= 7 ? 'var(--verde)' : p >= 6 ? 'var(--ambar)' : 'var(--rojo)'; }
function NC(p) { return p >= 7 ? 'nota-ok' : p >= 6 ? 'nota-warn' : 'nota-risk'; }
function promedio(arr) {
  const v = (arr || []).filter(x => x !== null && x !== undefined && x !== '');
  return v.length ? v.reduce((a, b) => a + Number(b), 0) / v.length : null;
}
function formatFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function formatFechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day:'2-digit', month:'short' });
}
function tiempoDesde(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} hs`;
  return `hace ${Math.floor(hrs / 24)} días`;
}
function labelTipo(t) {
  return { convivencia:'Convivencia', emocional:'Emocional', familiar:'Familiar', aprendizaje:'Aprendizaje', salud:'Salud', conducta:'Conducta', otro:'Otro' }[t] || t;
}
function labelEstado(e) {
  return { abierta:'Sin atender', en_seguimiento:'En seguimiento', resuelta:'Resuelto', derivada:'Derivado' }[e] || e;
}
function labelEstadoCls(e) {
  return e === 'abierta' ? 'tr' : e === 'en_seguimiento' ? 'ta' : 'tg';
}
function showLoading(pageId) {
  const pg = document.getElementById('page-' + pageId);
  if (pg) pg.innerHTML = `<div class="loading-state"><div class="spinner"></div><div>Cargando...</div></div>`;
}
function showError(pageId, msg) {
  const pg = document.getElementById('page-' + pageId);
  if (pg) pg.innerHTML = `<div class="empty-state">⚠️<br>${msg}</div>`;
}

// ── ARRANQUE AL CARGAR LA PÁGINA ─────────────────────
window.addEventListener('load', () => {
  document.getElementById('login-screen').style.display = 'none';
  verificarSesion();
});

// Enter en el login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const ls = document.getElementById('login-screen');
    if (ls && ls.style.display !== 'none') login();
  }
});