# Admin Dashboard — Setup Guide

This adds a secure admin dashboard to your existing portfolio site (`index.html`, `portfolio.html`, unchanged design) backed by Supabase. Follow these steps in order — the whole setup takes about 15–20 minutes.

## What was added

```
/assets
  supabase-config.js     <- you fill in your Supabase URL + anon key here
  supabase-client.js     <- creates the shared Supabase client
  ui-helpers.js          <- shared toast notifications + confirm dialogs
  contact-form.js        <- powers the new contact form
  site-data.js           <- loads projects/testimonials from Supabase into the public pages
  contact-and-ui.css     <- styles for the above (style.css is untouched)
/admin
  login.html             <- admin sign-in page
  dashboard.html         <- the dashboard itself (Overview, Messages, Projects, Testimonials)
  css/admin.css
  js/*.js
/supabase
  schema.sql             <- run this once in your Supabase project
SETUP.md                 <- this file
```

Your original `index.html`, `portfolio.html`, `style.css`, `script.js`, images, and video are all preserved — the contact form and a small loader script were added, nothing was removed.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**. Pick a name (e.g. `abdellahteha-portfolio`), a strong database password (save it somewhere safe), and a region close to Dubai (e.g. `ap-south-1` or similar).
3. Wait a minute or two for the project to finish provisioning.

## 2. Run the database schema

1. In your Supabase project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy its entire contents, paste into the editor, and click **Run**.
3. This creates four tables (`messages`, `projects`, `testimonials`, `admins`), locks them down with Row Level Security, and seeds your existing 6 projects + 3 testimonials so the dashboard isn't empty on first login.
4. If you see a notice about `supabase_realtime publication not found`, go to **Database → Replication**, find the `messages` table, and toggle it on. (Most projects already have this enabled by default — the notice is just a safety net.)

## 3. Create your admin login

You do **not** sign up through a public form — you create your own login directly in Supabase, then tell the database it's an admin.

1. In Supabase, go to **Authentication → Users → Add user → Create new user**.
2. Enter your email (e.g. `abdellateha7@gmail.com`) and a strong password. Tick **Auto Confirm User** so you don't need an email confirmation step.
3. Click **Create user**, then copy the new user's **UID** (shown in the users list).
4. Go back to **SQL Editor** and run:
   ```sql
   insert into public.admins (id, email)
   values ('PASTE-THE-UID-HERE', 'your-email@example.com');
   ```
5. That's it — this account can now log into `/admin/login.html`. Repeat steps 1–4 for any additional admins you want.

## 4. Connect the frontend to Supabase

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public** key (NOT the `service_role` key).
3. Open `assets/supabase-config.js` in this project and fill in both values:
   ```js
   window.SUPABASE_CONFIG = {
     url: 'https://your-project-ref.supabase.co',
     anonKey: 'your-long-anon-key'
   };
   ```
4. Save the file.

**Security note:** The anon key is meant to be public — it's protected by the Row Level Security policies in `schema.sql`, not by secrecy. Never put the `service_role` key in this file or anywhere else in the site's frontend code; it bypasses all security rules.

## 5. Test locally (optional but recommended)

From the project folder, run a simple local server so `fetch` requests work correctly (opening `index.html` directly via `file://` can cause issues in some browsers):

```bash
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/` — your homepage; try submitting the contact form.
- `http://localhost:8080/admin/login.html` — sign in with the admin account you created in step 3.

Check that:
- The message you submitted on the homepage shows up under **Messages** in the dashboard (it should also arrive instantly if the dashboard tab is already open, thanks to Supabase Realtime).
- You can change a message's status and delete it (with a confirmation prompt).
- You can add, edit, and delete a project — check it appears/disappears on the homepage and `portfolio.html`.
- You can add, edit, and delete a testimonial — check it appears/disappears on the homepage.
- Logging out redirects you to the login page, and visiting `/admin/dashboard.html` directly while logged out also redirects you to login.

## 6. Deploy to GitHub Pages

Nothing changes about how you deploy — this is still a static site:

```bash
git add .
git commit -m "Add Supabase-powered admin dashboard and contact form"
git push
```

GitHub Pages will serve the new `/admin` folder and `/assets` folder exactly like your existing pages. Your custom domain (`abdellahteha.com`, from `CNAME`) keeps working unchanged.

## Security notes (please read)

- **Never** commit or paste your Supabase `service_role` key into any file in this repository. Only the `anon` key belongs in `assets/supabase-config.js`.
- All access control is enforced by **Row Level Security** in `supabase/schema.sql`, not by hiding the `/admin` URLs. Anyone can technically load `admin/login.html`, but without valid admin credentials they cannot read or change any data — the database itself refuses the request.
- The `admins` table is the single source of truth for who is an admin. Add or remove admins by inserting/deleting rows there (via SQL Editor or Table Editor) — there is intentionally no public "sign up as admin" flow.
- The contact form has a hidden honeypot field and basic length limits as first-line spam defenses. If you start receiving spam, consider adding a CAPTCHA (e.g. Cloudflare Turnstile) in front of the form, or a Supabase Edge Function that rate-limits submissions by IP — happy to add either if needed.
- Traffic/visitor analytics (page views, sessions, etc.) already exist via the Google Analytics and Microsoft Clarity snippets embedded in your pages — check those dashboards directly for that. The admin dashboard's "Overview" tab shows *content* stats (message counts, project/testimonial counts) pulled from your own database instead, since that's data GA/Clarity don't have.

## Troubleshooting

- **"Supabase isn't configured yet" message on login/dashboard:** you haven't filled in `assets/supabase-config.js` yet, or there's a typo in the URL/key.
- **Login succeeds but immediately redirects back to login:** the account isn't in the `admins` table yet — repeat step 3.
- **Contact form shows "isn't connected yet":** same as above — check `assets/supabase-config.js`.
- **New messages don't appear automatically:** confirm Realtime is enabled for the `messages` table (Database → Replication in Supabase).
