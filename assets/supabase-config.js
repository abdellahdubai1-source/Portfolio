/**
 * Supabase public configuration.
 * ------------------------------------------------------------------------
 * Fill in the two values below with YOUR Supabase project's URL and
 * "anon" / "public" API key (Project Settings → API in the Supabase
 * dashboard).
 *
 * SECURITY NOTE — READ THIS:
 * The "anon" key is DESIGNED to be public. It is safe to ship inside
 * frontend JavaScript because it can only do what your Row Level Security
 * (RLS) policies allow (see supabase/schema.sql). It is NOT a secret.
 *
 * The "service_role" key, on the other hand, bypasses RLS entirely and
 * must NEVER appear in this file, in any file shipped to the browser, or
 * in a public GitHub repository. It is only for trusted server-side code,
 * which this static site does not have (and does not need for this
 * project).
 * ------------------------------------------------------------------------
 */
window.SUPABASE_CONFIG = {
  url:'https://eodubropqkolcqyljblq.supabase.co',
  anonKey: 'sb_publishable_ivCaxvKmp2-TwNyCOpPnzg_4gEgDFNh'
};
