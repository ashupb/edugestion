// =====================================================
// EduGestión — Configuración
// =====================================================

const SUPABASE_URL     = 'https://vxsgzutluqfonhakiltz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_99GO4UBXXyv7NPAEs2JCkg__SkwuWbu';

// Cliente Supabase — disponible globalmente como `sb`
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_CONFIG = {
  nombre:  'Kairu',
  version: '1.0.0-mvp',
};