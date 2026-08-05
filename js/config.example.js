/* ==================== ONLINE CONFIG — TEMPLATE ====================

   HOW TO USE THIS FILE
   1. Copy it to `js/config.js`   (same folder, drop the `.example`)
   2. Paste your two Supabase values below
   3. Reload the game

   `js/config.js` is listed in .gitignore, so your keys stay out of git.
   This template is the only one of the two that is committed.

   WHERE TO FIND THE VALUES
   Supabase dashboard -> your project -> Settings -> API
     - "Project URL"          -> SUPABASE_URL
     - "Project API keys" -> `anon` `public`  -> SUPABASE_ANON_KEY

   The anon key is designed to be public and ships in the browser. It is not a
   secret, and it is not an admin key — what it may do is decided entirely by
   the Row Level Security policies in SHIP.md §8.2. Never paste the
   `service_role` key here: that one bypasses RLS and would let anyone holding
   it rewrite the whole leaderboard.

   WITHOUT THIS FILE the game runs exactly as it always has. `js/config.js` is
   missing on a fresh clone, its <script> tag 404s harmlessly, ALPHA_CONFIG
   stays undefined, and every online feature switches itself off. The single
   player game never touches the network. That is the invariant — see
   SHIP.md §1. */

window.ALPHA_CONFIG = {
  SUPABASE_URL:      'https://YOUR-PROJECT-REF.supabase.co',
  SUPABASE_ANON_KEY: 'PASTE-YOUR-PUBLIC-ANON-KEY-HERE',
};
