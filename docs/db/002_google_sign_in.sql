-- monsalaire: sign in with Google, verified by monsalaire itself (not Supabase Auth), so accounts stay out of
-- auth.users and separate from Aconta accounts. Run once in the SQL editor of aconta-preview.

begin;
alter table monsalaire.accounts alter column password_hash drop not null;
alter table monsalaire.accounts add column google_sub text unique;
commit;
