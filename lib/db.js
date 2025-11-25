import pkg from 'pg';
const { Pool } = pkg;

let pool;
let driver = null;
let initAttempted = false;
let initError = null;

function initializePool() {
  if (initAttempted) return;
  initAttempted = true;

  console.log('🔍 Initializing database connection...');
  console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      if (parsed.hostname && ['base', 'example', 'localhost-placeholder'].includes(parsed.hostname)) {
        console.warn(`⚠️ Skipping DATABASE_URL because the host looks like a placeholder: ${parsed.hostname}`);
      } else {
        console.log(`ℹ️ Attempting PostgreSQL connection to ${parsed.hostname}`);
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        driver = 'pg';
        console.log('✅ PostgreSQL connection pool initialized successfully');
        return;
      }
    } catch (err) {
      console.warn(`⚠️ DATABASE_URL parsing/connection failed: ${err.message}`);
      initError = err;
    }
  }

  if (!initError) {
    initError = new Error('No supported database configuration found');
  }
  console.warn('⚠️ WARNING: Missing or invalid DATABASE_URL');
}

function ensurePool() {
  if (!initAttempted) {
    initializePool();
  }

  if (initError) {
    throw new Error(`Database not available: ${initError.message}`);
  }

  if (!pool || !driver) {
    throw new Error('Database pool not initialized');
  }

  return { pool, driver };
}

function formatInsertPlaceholders(keys) {
  return keys.map((_, i) => `$${i + 1}`).join(',');
}

export async function runQuery(table, values, action = 'insert', where = null) {
  const { pool: dbPool } = ensurePool();

  try {
    if (action === 'insert') {
      const keys = Object.keys(values);
      const vals = Object.values(values);
      const placeholders = formatInsertPlaceholders(keys);
      const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`;
      const result = await dbPool.query(sql, vals);
      return result.rows[0];
    } else if (action === 'update') {
      if (!where) throw new Error('WHERE clause required for update');
      const keys = Object.keys(values);
      const vals = Object.values(values);
      const setKeys = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const sql = `UPDATE ${table} SET ${setKeys} WHERE ${where.column} = $${keys.length + 1} RETURNING *`;
      const result = await dbPool.query(sql, [...vals, where.value]);
      return result.rows[0] || { affectedRows: result.rowCount, ...values };
    } else if (action === 'delete') {
      if (!where) throw new Error('WHERE clause required for delete');
      const sql = `DELETE FROM ${table} WHERE ${where.column} = $1`;
      const result = await dbPool.query(sql, [where.value]);
      return { success: true, affectedRows: result.rowCount };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    console.error(`Database error in runQuery (${action} on ${table}):`, err);
    throw err;
  }
}

export async function getQuery(table, column, value) {
  const { pool: dbPool } = ensurePool();

  try {
    const sql = `SELECT * FROM ${table} WHERE ${column} = $1 LIMIT 1`;
    const result = await dbPool.query(sql, [value]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error(`Database error in getQuery (${table}.${column}):`, err);
    throw err;
  }
}

export async function allQuery(table, column = null, value = null) {
  const { pool: dbPool } = ensurePool();

  try {
    if (column === null || value === null) {
      const sql = `SELECT * FROM ${table}`;
      const result = await dbPool.query(sql);
      return result.rows;
    }

    if (typeof value === 'string' && (value.startsWith('>=') || value.startsWith('<=') || value.startsWith('>') || value.startsWith('<'))) {
      const operator = value.match(/^(>=|<=|>|<)/)[0];
      const actualValue = value.substring(operator.length);
      const sql = `SELECT * FROM ${table} WHERE ${column} ${operator} $1`;
      const result = await dbPool.query(sql, [actualValue]);
      return result.rows;
    } else {
      const sql = `SELECT * FROM ${table} WHERE ${column} = $1`;
      const result = await dbPool.query(sql, [value]);
      return result.rows;
    }
  } catch (err) {
    console.error(`Database error in allQuery (${table}.${column}):`, err);
    throw err;
  }
}

export async function allRows(table) {
  const { pool: dbPool } = ensurePool();

  try {
    const sql = `SELECT * FROM ${table}`;
    const result = await dbPool.query(sql);
    return result.rows;
  } catch (err) {
    console.error(`Database error in allRows (${table}):`, err);
    throw err;
  }
}

export async function customQuery(sql, params = []) {
  const { pool: dbPool } = ensurePool();

  try {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await dbPool.query(pgSql, params);
    return result.rows;
  } catch (err) {
    console.error('Database error in customQuery:', err);
    throw err;
  }
}

export function getPool() {
  return ensurePool();
}

initializePool();
