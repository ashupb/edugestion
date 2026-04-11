// =====================================================
// NAV.JS — Menú lateral por rol
// =====================================================

const NAV_CONFIG = {
  directivo: [
    { sec: 'General' },
    { id:'dash',      icon:'🏠', label:'Inicio' },
    { id:'reuniones', icon:'🤝', label:'Reuniones' },
    { sec: 'Gestión institucional' },
    { id:'prob',      icon:'⚠️', label:'Problemáticas' },
    { id:'obj',       icon:'🎯', label:'Objetivos' },
    { id:'eoe',       icon:'🧠', label:'EOE' },
    { sec: 'Académico' },
    { id:'asist',     icon:'✅', label:'Asistencia' },
    { id:'notas',     icon:'📊', label:'Calificaciones' },
    { sec: 'Institución' },
    { id:'leg',       icon:'🗂️', label:'Legajos' },
    { id:'admin',     icon:'⚙️', label:'Configuración' },
  ],
  eoe: [
    { sec: 'General' },
    { id:'dash',      icon:'🏠', label:'Inicio' },
    { id:'reuniones', icon:'🤝', label:'Reuniones' },
    { sec: 'Orientación' },
    { id:'eoe',       icon:'🧠', label:'Mis casos' },
    { id:'prob',      icon:'⚠️', label:'Todas las situaciones' },
    { id:'obj',       icon:'🎯', label:'Objetivos' },
    { sec: 'Recursos' },
    { id:'leg',       icon:'🗂️', label:'Legajos' },
  ],
  docente: [
    { sec: 'General' },
    { id:'dash',      icon:'🏠', label:'Inicio' },
    { id:'reuniones', icon:'🤝', label:'Reuniones' },
    { sec: 'Mis clases' },
    { id:'asist',     icon:'✅', label:'Asistencia' },
    { id:'notas',     icon:'📊', label:'Calificaciones' },
    { sec: 'Institucional' },
    { id:'prob',      icon:'⚠️', label:'Reportar situación' },
    { id:'obj',       icon:'🎯', label:'Objetivos' },
  ],
  preceptor: [
    { sec: 'General' },
    { id:'dash',      icon:'🏠', label:'Inicio' },
    { id:'reuniones', icon:'🤝', label:'Reuniones' },
    { sec: 'Mis cursos' },
    { id:'asist',     icon:'✅', label:'Tomar lista' },
    { sec: 'Institucional' },
    { id:'prob',      icon:'⚠️', label:'Reportar situación' },
    { id:'obj',       icon:'🎯', label:'Objetivos' },
    { id:'leg',       icon:'🗂️', label:'Legajos' },
  ],
  admin: [
    { sec: 'General' },
    { id:'dash',      icon:'🏠', label:'Inicio' },
    { sec: 'Sistema' },
    { id:'admin',     icon:'⚙️', label:'Configuración' },
    { id:'leg',       icon:'🗂️', label:'Instituciones' },
  ],
};

function renderNav() {
  const nav   = document.getElementById('sb-nav');
  const items = NAV_CONFIG[USUARIO_ACTUAL?.rol] || NAV_CONFIG.docente;
  nav.innerHTML = '';

  items.forEach(item => {
    if (item.sec) {
      const s = document.createElement('div');
      s.className   = 'sb-section';
      s.textContent = item.sec;
      nav.appendChild(s);
      return;
    }
    const el       = document.createElement('div');
    el.className   = 'nav-it' + (item.id === CUR_PAGE ? ' on' : '');
    el.onclick     = () => goPage(item.id);
    el.innerHTML   = `<span class="ni-icon">${item.icon}</span><span class="ni-label">${item.label}</span>`;
    nav.appendChild(el);
  });
}