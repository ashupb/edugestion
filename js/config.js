// =====================================================
// EduGestión — Configuración
// =====================================================

const SUPABASE_URL     = 'https://vxsgzutluqfonhakiltz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4c2d6dXRsdXFmb25oYWtpbHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDYxNzYsImV4cCI6MjA5MTQyMjE3Nn0.SFGAg7XkO_FFVWj0ZoSN_16piibrl9CfJMyH_62gwtw';

// Cliente Supabase — disponible globalmente como `sb`
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_CONFIG = {
  nombre:  'EduGestión',
  version: '1.0.0-mvp',
};