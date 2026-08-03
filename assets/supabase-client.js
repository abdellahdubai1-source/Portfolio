/**
 * Creates a single shared Supabase client at window.sb.
 * Requires supabase-config.js and the Supabase JS CDN script to be loaded
 * before this file. Fails silently (with a console warning) if either is
 * missing, so pages never hard-crash just because Supabase isn't configured
 * yet — public pages fall back to their static content.
 */
(function () {
  'use strict';

  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.warn('[supabase-client] Supabase JS library not found. Did the CDN <script> tag load?');
    return;
  }

  if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey ||
      window.SUPABASE_CONFIG.url.indexOf('YOUR-PROJECT-REF') !== -1) {
    console.warn('[supabase-client] SUPABASE_CONFIG is not set up yet. Edit assets/supabase-config.js with your project URL and anon key.');
    return;
  }

  try {
    window.sb = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    );
  } catch (err) {
    console.error('[supabase-client] Failed to create Supabase client:', err);
  }
})();
