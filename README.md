# Nestora Realty Advisory

Static frontend plus Supabase-backed property and inquiry management.

## Connect Supabase

1. Create a project at [Supabase](https://supabase.com/).
2. Open the SQL Editor, create a new query, paste in `schema.sql`, and run it.
3. In Authentication > Users, create the admin user you will use to manage listings.
4. In the SQL Editor, run this once, replacing the email address with your admin email:

   ```sql
   insert into public.profiles (id, is_admin)
   select id, true from auth.users where email = 'your-admin-email@example.com';
   ```

5. Copy the project URL and anon public key from Project Settings > API into `supabase-config.js`.
6. Deploy the entire folder to Netlify or Vercel for the simplest production workflow. GitHub Pages also works because this is a static frontend; add your deployed domain to Supabase Authentication > URL Configuration if you use it.

## Production notes

- The anon key is intended for frontend use. Database access is protected by the RLS policies in `schema.sql`.
- Property images are currently stored as external image URLs. For uploads later, create a Supabase Storage bucket and extend the admin form.
- Public visitors can browse available properties and submit inquiries. Only the Supabase user marked as an admin can manage listings and view inquiries.
