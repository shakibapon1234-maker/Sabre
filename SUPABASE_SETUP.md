# Sabre security deployment

The app contains only the public Supabase key. Never add a service-role key to this repository, Electron build, or Android APK.

1. Run `supabase/migrations/202609240001_security.sql` in the Sabre project's SQL Editor.
2. In Supabase Auth, enable Email sign-in and disable public sign-up and anonymous sign-in.
3. Deploy the included `login-with-device`, `device-license`, and `admin-users` Edge Functions after setting the Sabre project ref with `supabase link`.
4. Create the first supervisor in Auth, then add a matching `profiles` row with `role = 'supervisor'`.

The Edge Functions must retain `SUPABASE_SERVICE_ROLE_KEY` only as a Supabase-managed environment secret.

The Android APK uses this same account and device gate. Do not restore an
offline key generator or embed a license-signing secret in an APK.

For account administration, deploy `admin-users` and open `Security_Admin.html`.
It is a separate supervisor-only interface; it does not replace the desktop admin panel.
