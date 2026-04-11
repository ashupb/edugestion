// =====================================================
// AUTH.JS — Login y sesión real con Supabase
// =====================================================

let USUARIO_ACTUAL    = null;  // datos del usuario logueado
let INSTITUCION_ACTUAL = null; // datos de su institución

// ── LOGIN ────────────────────────────────────────────
async function login() {
  const email = document.getElementById('inp-email').value.trim();
  const pass  = document.getElementById('inp-pass').value;
  const btn   = document.getElementById('btn-login');

  if (!email || !pass) {
    mostrarErrorLogin('Completá email y contraseña.');
    return;
  }

  btn.disabled = true;
  document.getElementById('btn-login-text').textContent = 'Ingresando...';
  ocultarErrorLogin();

  try {
    // 1. Autenticar con Supabase Auth
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });

    if (error) {
      mostrarErrorLogin('Email o contraseña incorrectos.');
      resetBtn();
      return;
    }

    // 2. Traer perfil de la tabla usuarios
    const { data: perfil, error: errPerfil } = await sb
      .from('usuarios')
      .select('*, institucion:instituciones(id, nombre, logo_url)')
      .eq('id', data.user.id)
      .single();

    if (errPerfil || !perfil) {
      mostrarErrorLogin('Tu usuario no está configurado. Contactá al administrador.');
      await sb.auth.signOut();
      resetBtn();
      return;
    }

    if (!perfil.activo) {
      mostrarErrorLogin('Tu cuenta está desactivada. Contactá al administrador.');
      await sb.auth.signOut();
      resetBtn();
      return;
    }

    // 3. Guardar estado global
    USUARIO_ACTUAL     = { ...data.user, ...perfil };
    INSTITUCION_ACTUAL = perfil.institucion;

    iniciarApp();

  } catch (e) {
    mostrarErrorLogin('Error de conexión. Verificá tu internet.');
    resetBtn();
  }
}

// ── CERRAR SESIÓN ────────────────────────────────────
async function cerrarSesion() {
  await sb.auth.signOut();
  USUARIO_ACTUAL     = null;
  INSTITUCION_ACTUAL = null;
  document.getElementById('shell').style.display       = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('inp-email').value = '';
  document.getElementById('inp-pass').value  = '';
  resetBtn();
}

// ── VERIFICAR SESIÓN AL CARGAR ───────────────────────
async function verificarSesion() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    document.getElementById('login-screen').style.display = 'flex';
    return;
  }

  const { data: perfil } = await sb
    .from('usuarios')
    .select('*, institucion:instituciones(id, nombre, logo_url)')
    .eq('id', session.user.id)
    .single();

  if (perfil && perfil.activo) {
    USUARIO_ACTUAL     = { ...session.user, ...perfil };
    INSTITUCION_ACTUAL = perfil.institucion;
    iniciarApp();
  } else {
    await sb.auth.signOut();
    document.getElementById('login-screen').style.display = 'flex';
  }
}

// ── ESCUCHAR CAMBIOS DE SESIÓN ───────────────────────
sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    USUARIO_ACTUAL     = null;
    INSTITUCION_ACTUAL = null;
    document.getElementById('shell').style.display       = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  }
});

// ── HELPERS ──────────────────────────────────────────
function mostrarErrorLogin(msg) {
  const el = document.getElementById('login-error');
  el.textContent   = msg;
  el.style.display = 'block';
}
function ocultarErrorLogin() {
  document.getElementById('login-error').style.display = 'none';
}
function resetBtn() {
  const btn = document.getElementById('btn-login');
  btn.disabled = false;
  document.getElementById('btn-login-text').textContent = 'Ingresar';
}