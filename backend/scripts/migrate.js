import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';

const {
  DB_HOST, DB_PORT = 3306, DB_USER, DB_PASSWORD, DB_NAME
} = process.env;

function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

async function ensureMigrationsTable(conn) {
  const sql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await conn.query(sql);
}

async function getApplied(conn) {
  const [rows] = await conn.query('SELECT filename, checksum FROM schema_migrations');
  const map = new Map();
  for (const r of rows) map.set(r.filename, r.checksum);
  return map;
}

async function withAdvisoryLock(conn, lockName = 'db_migrate_lock', timeoutSec = 30) {
  const [rows] = await conn.query('SELECT GET_LOCK(?, ?)', [lockName, timeoutSec]);
  if (!rows || !Object.values(rows[0])[0]) {
    throw new Error('Could not acquire migration lock');
  }
  return async () => {
    try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
  };
}

async function run() {
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error('Missing DB env vars: DB_HOST, DB_USER, DB_NAME (and DB_PASSWORD if needed)');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  const release = await withAdvisoryLock(conn);

  try {
    await ensureMigrationsTable(conn);

    // Read migrations dir and sort files like 000_, 001_, 010_...
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    let files = await fs.readdir(migrationsDir);
    files = files
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b)); // relies on 000_, 001_ naming

    const applied = await getApplied(conn);

    for (const file of files) {
      const full = path.join(migrationsDir, file);
      const sql = await fs.readFile(full, 'utf8');
      const checksum = sha256(sql);

      if (applied.has(file)) {
        // If already applied but checksum changed, warn (don’t re-apply)
        if (applied.get(file) !== checksum) {
          console.warn(`Migration ${file} already applied but checksum differs. Do not edit old migrations. Create a new one instead.`);
        } else {
          console.log(`Skipping already applied: ${file}`);
        }
        continue;
      }

      console.log(`Applying ${file} ...`);
      try {
        await conn.beginTransaction();
        await conn.query(sql);
        await conn.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)',
          [file, checksum]
        );
        await conn.commit();
        console.log(`${file} applied`);
      } catch (err) {
        try { await conn.rollback(); } catch (_) {}
        console.error(`Failed on ${file}:`, err.message);
        process.exit(1);
      }
    }

    console.log('All pending migrations applied.');
  } finally {
    try { await release(); } catch (_) {}
    await conn.end();
  }
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
