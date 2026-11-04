-- monsalaire: profile photo (from Google) and per-member visit stats. Run once in the SQL editor of aconta-preview.
begin;
alter table monsalaire.accounts add column picture_url text;
alter table monsalaire.accounts add column visits int not null default 0;
alter table monsalaire.accounts add column last_seen_at timestamptz;
commit;
