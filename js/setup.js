// =====================================================
// SETUP.JS — Configuración inicial de institución
// Se muestra cuando el usuario autenticado tiene
// institucion_id = NULL en la tabla usuarios
// =====================================================

function iniciarSetupInstitucional() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('shell').style.display        = 'none';
  document.getElementById('setup-screen').style.display = 'flex';

  // Pre-llenar año lectivo con el año actual
  const inp = document.getElementById('setup-anio');
  if (inp && !inp.value) inp.value = new Date().getFullYear();
}

async function guardarInstitucion() {
  const nombre    = document.getElementById('setup-nombre')?.value.trim();
  const localidad = document.getElementById('setup-localidad')?.value.trim() || null;
  const nivel     = document.getElementById('setup-nivel')?.value || null;
  const anio      = parseInt(document.getElementById('setup-anio')?.value) || new Date().getFullYear();

  const errEl = document.getElementById('setup-error');
  errEl.style.display = 'none';

  if (!nombre) {
    errEl.textContent   = 'El nombre de la institución es obligatorio.';
    errEl.style.display = 'block';
    return;
  }

  const btn  = document.getElementById('btn-setup');
  const txtEl = document.getElementById('btn-setup-text');
  btn.disabled    = true;
  txtEl.textContent = 'Configurando...';

  try {
    // 1. Crear la institución
    const { data: inst, error: errInst } = await sb
      .from('instituciones')
      .insert({ nombre, localidad })
      .select('id, nombre, logo_url')
      .single();

    if (errInst) throw new Error('No se pudo crear la institución: ' + errInst.message);

    // 2. Actualizar el usuario con el nuevo institucion_id
    const { error: errUser } = await sb
      .from('usuarios')
      .update({ institucion_id: inst.id })
      .eq('id', USUARIO_ACTUAL.id);

    if (errUser) throw new Error('No se pudo vincular el usuario: ' + errUser.message);

    // 3. Crear el primer curso si se indicó nivel (facilita arrancar)
    if (nivel) {
      await sb.from('cursos').insert({
        institucion_id: inst.id,
        nombre:         'Curso inicial',
        anio:           1,
        division:       'A',
        nivel,
        ciclo_lectivo:  anio,
      });
    }

    // 4. Actualizar estado global y arrancar la app
    USUARIO_ACTUAL.institucion_id = inst.id;
    INSTITUCION_ACTUAL = inst;

    document.getElementById('setup-screen').style.display = 'none';
    iniciarApp();

  } catch (e) {
    errEl.textContent   = e.message;
    errEl.style.display = 'block';
    btn.disabled    = false;
    txtEl.textContent = 'Completar configuración';
  }
}
