import pg from 'pg';

/**
 * Connection to the `monsalaire` schema of the aconta-preview Supabase project, as the role `monsalaire_app`.
 * That role can read and write the `monsalaire` schema only, nothing of Aconta's own tables (see docs/db/).
 */
let pool: pg.Pool | null = null;

export function db(): pg.Pool {
  if (!pool) {
    const url = process.env.MONSALAIRE_DATABASE_URL;
    if (!url) throw new Error('MONSALAIRE_DATABASE_URL is not set');
    pool = new pg.Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
