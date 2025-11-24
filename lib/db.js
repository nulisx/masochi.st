import pkg from 'pg';
const { Pool } = pkg;

let pool;
let initAttempted = false;
let initError = null;

function initializePool() {
  if (initAttempted) return;
  initAttempted = true;

  if (process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      console.log('✅ PostgreSQL connection pool initialized successfully');
    } catch (err) {
      initError = err;
      console.error('❌ Failed to initialize PostgreSQL pool:', err);
    }
  } else {
    initError = new Error('DATABASE_URL not found');
    console.warn('⚠️ WARNING: Missing DATABASE_URL environment variable');
    console.warn('Database operations will fail until DATABASE_URL is configured.');
  }
}

function ensurePool() {
  if (!initAttempted) {
    initializePool();
  }
  
  if (initError) {
    throw new Error(`Database not available: ${initError.message}`);
  }
  
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  return pool;
}

export async function runQuery(table, values, action = 'insert', where = null) {
  const dbPool = ensurePool();
  
  try {
    if (action === 'insert') {
      const keys = Object.keys(values);
      const vals = Object.values(values);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`;
      const result = await dbPool.query(sql, vals);
      return result.rows[0];
    } else if (action === 'update') {
      if (!where) throw new Error('WHERE clause required for update');
      const setKeys = Object.keys(values).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const sql = `UPDATE ${table} SET ${setKeys} WHERE ${where.column} = $${Object.keys(values).length + 1} RETURNING *`;
      const result = await dbPool.query(sql, [...Object.values(values), where.value]);
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
  const dbPool = ensurePool();
  
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
  const dbPool = ensurePool();
  
  try {
    let sql, result;
    
    if (column === null || value === null) {
      sql = `SELECT * FROM ${table}`;
      result = await dbPool.query(sql);
    } else if (typeof value === 'string' && (value.startsWith('>=') || value.startsWith('<=') || value.startsWith('>') || value.startsWith('<'))) {
      const operator = value.match(/^(>=|<=|>|<)/)[0];
      const actualValue = value.substring(operator.length);
      sql = `SELECT * FROM ${table} WHERE ${column} ${operator} $1`;
      result = await dbPool.query(sql, [actualValue]);
    } else {
      sql = `SELECT * FROM ${table} WHERE ${column} = $1`;
      result = await dbPool.query(sql, [value]);
    }
    
    return result.rows;
  } catch (err) {
    console.error(`Database error in allQuery (${table}.${column}):`, err);
    throw err;
  }
}

export async function allRows(table) {
  const dbPool = ensurePool();
  
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
  const dbPool = ensurePool();
  
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
