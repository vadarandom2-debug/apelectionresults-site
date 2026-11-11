// Supabase connection for the public site and the admin page.
// Normally leave these empty: on Vercel the values come from the project's Environment Variables via
// api/config.js (loaded right after this file), and locally server.py reads the same variables.
// You can still hard-code them here instead. The anon key is meant to be public: row-level security in
// supabase/schema.sql makes the data read-only for everyone except listed admins.
window.SUPABASE_URL = "";      // e.g. "https://abcdefghijkl.supabase.co"
window.SUPABASE_ANON_KEY = ""; // the "anon public" key
// On the live domain the public pages skip the api/config.js call (one Vercel request per visit) and use these.
if (/(^|\.)apelectionresults\.com$/.test(location.hostname)) {
  window.SUPABASE_URL = "https://bnrdvcfkavmyqukbuozg.supabase.co";
  window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucmR2Y2ZrYXZteXF1a2J1b3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNDMyMzksImV4cCI6MjEwNjYxOTIzOX0.a7VtPQdrxmk6jgbnQ_ARSiEPZu3LIiZYr1wci7j9O3E";
}
