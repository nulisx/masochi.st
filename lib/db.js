import pkg from 'pg';
const { Pool } = pkg;
import mysql from 'mysql2/promise';

let pool;
let driver = null; // 'pg' or 'mysql'
let initAttempted = false;
let initError = null;

function initializePool() {
  if (initAttempted) return;
  initAttempted = true;

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      // Ignore obviously-bad placeholder hosts (e.g. 'base') that may be
      // present in some deploy configs — prefer explicit MariaDB env vars
      if (parsed.hostname && ['base', 'example', 'localhost-placeholder'].includes(parsed.hostname)) {
        console.warn(`⚠️ Skipping DATABASE_URL because the host looks like a placeholder: ${parsed.hostname}`);
      } else {
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        driver = 'pg';
        console.log('✅ PostgreSQL connection pool initialized successfully');
        return;
      }
    } catch (err) {
      if (initAttempted) return;
      initAttempted = true;

      console.log('🔍 Initializing database connection...');
      console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
      console.log('MARIADB_HOST present:', !!process.env.MARIADB_HOST);
      console.log('MARIADB_USER present:', !!process.env.MARIADB_USER);

      // Try DATABASE_URL first, but only if it looks valid
    }
  }

  const password = process.env.MARIADB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
  const database = process.env.MARIADB_DATABASE || process.env.MYSQL_DATABASE || process.env.DB_DATABASE;
  const port = process.env.MARIADB_PORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306;
            console.log(`ℹ️ Attempting PostgreSQL connection to ${parsed.hostname}`);

  if (host && user && database) {
    try {
      console.log(`ℹ️ Detected MySQL/MariaDB host: ${host}`);
      pool = mysql.createPool({
        host,
        user,
        password,
        database,
          console.warn(`⚠️ DATABASE_URL parsing/connection failed: ${err.message}. Falling back to MariaDB env vars.`);
        connectionLimit: 10,
        queueLimit: 0,

      // Try MariaDB/MySQL
        charset: 'utf8mb4'
      });
      driver = 'mysql';
      console.log('✅ MySQL/MariaDB connection pool initialized successfully');
      const port = Number(process.env.MARIADB_PORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
    } catch (err) {
      initError = err;
          console.log(`ℹ️ Detected MySQL/MariaDB host: ${host}:${port}, DB: ${database}, User: ${user}`);
    }
  }

  initError = new Error('No supported database configuration found');
  console.warn('⚠️ WARNING: Missing DATABASE_URL or MariaDB/MySQL environment variables');
            port,
}

function ensurePool() {
  if (!initAttempted) {
    initializePool();
  }

  if (initError) {
    throw new Error(`Database not available: ${initError.message}`);
  }

  if (!pool || !driver) {
      } else {
        console.warn('⚠️ Missing MariaDB environment variables:');
        if (!host) console.warn('  - MARIADB_HOST (or MYSQL_HOST / DB_HOST)');
        if (!user) console.warn('  - MARIADB_USER (or MYSQL_USER / DB_USER)');
        if (!database) console.warn('  - MARIADB_DATABASE (or MYSQL_DATABASE / DB_DATABASE)');
    throw new Error('Database pool not initialized');
  }

  return { pool, driver };
}

function formatInsertPlaceholders(keys, drv) {
  if (drv === 'pg') return keys.map((_, i) => `$${i + 1}`).join(',');
  return keys.map(() => '?').join(',');
}

export async function runQuery(table, values, action = 'insert', where = null) {
  const { pool: dbPool, driver: drv } = ensurePool();

  try {
    if (action === 'insert') {
      const keys = Object.keys(values);
      const vals = Object.values(values);
      const placeholders = formatInsertPlaceholders(keys, drv);

      if (drv === 'pg') {
        const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`;
        const result = await dbPool.query(sql, vals);
        return result.rows[0];
      } else {
        const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
        const [result] = await dbPool.execute(sql, vals);
        const insertId = result.insertId || null;
        if (insertId) {
          const [rows] = await dbPool.execute(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [insertId]);
          return rows.length ? rows[0] : { id: insertId };
        }
        return { affectedRows: result.affectedRows, ...values };
      }
    } else if (action === 'update') {
      if (!where) throw new Error('WHERE clause required for update');
      const keys = Object.keys(values);
      const vals = Object.values(values);

      if (drv === 'pg') {
        const setKeys = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const sql = `UPDATE ${table} SET ${setKeys} WHERE ${where.column} = $${keys.length + 1} RETURNING *`;
        const result = await dbPool.query(sql, [...vals, where.value]);
        return result.rows[0] || { affectedRows: result.rowCount, ...values };
      } else {
        const setKeys = keys.map((k) => `${k} = ?`).join(', ');
        const sql = `UPDATE ${table} SET ${setKeys} WHERE ${where.column} = ?`;
        const params = [...vals, where.value];
        const [result] = await dbPool.execute(sql, params);
        if (result.affectedRows) {
          const [rows] = await dbPool.execute(`SELECT * FROM ${table} WHERE ${where.column} = ? LIMIT 1`, [where.value]);
          return rows.length ? rows[0] : { affectedRows: result.affectedRows };
        }
        return { affectedRows: result.affectedRows };
      }
    } else if (action === 'delete') {
      if (!where) throw new Error('WHERE clause required for delete');
      if (drv === 'pg') {
        const sql = `DELETE FROM ${table} WHERE ${where.column} = $1`;
        const result = await dbPool.query(sql, [where.value]);
        return { success: true, affectedRows: result.rowCount };
      } else {
        const sql = `DELETE FROM ${table} WHERE ${where.column} = ?`;
        const [result] = await dbPool.execute(sql, [where.value]);
        return { success: true, affectedRows: result.affectedRows };
      }
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    console.error(`Database error in runQuery (${action} on ${table}):`, err);
    throw err;
  }
}

export async function getQuery(table, column, value) {
  const { pool: dbPool, driver: drv } = ensurePool();

  try {
    if (drv === 'pg') {
      const sql = `SELECT * FROM ${table} WHERE ${column} = $1 LIMIT 1`;
      const result = await dbPool.query(sql, [value]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } else {
      const sql = `SELECT * FROM ${table} WHERE ${column} = ? LIMIT 1`;
      const [rows] = await dbPool.execute(sql, [value]);
      return rows.length > 0 ? rows[0] : null;
    }
  } catch (err) {
    console.error(`Database error in getQuery (${table}.${column}):`, err);
    throw err;
  }
}

export async function allQuery(table, column = null, value = null) {
  const { pool: dbPool, driver: drv } = ensurePool();

  try {
    if (column === null || value === null) {
      const sql = `SELECT * FROM ${table}`;
      if (drv === 'pg') {
        const result = await dbPool.query(sql);
        return result.rows;
      } else {
        const [rows] = await dbPool.execute(sql);
        return rows;
      }
    }

    if (typeof value === 'string' && (value.startsWith('>=') || value.startsWith('<=') || value.startsWith('>') || value.startsWith('<'))) {
      const operator = value.match(/^(>=|<=|>|<)/)[0];
      const actualValue = value.substring(operator.length);
      const sql = `SELECT * FROM ${table} WHERE ${column} ${operator} $1`;
      if (drv === 'pg') {
        const result = await dbPool.query(sql, [actualValue]);
        return result.rows;
      } else {
        const sqlm = `SELECT * FROM ${table} WHERE ${column} ${operator} ?`;
        const [rows] = await dbPool.execute(sqlm, [actualValue]);
        return rows;
      }
    } else {
      if (drv === 'pg') {
        const sql = `SELECT * FROM ${table} WHERE ${column} = $1`;
        const result = await dbPool.query(sql, [value]);
        return result.rows;
      } else {
        const sql = `SELECT * FROM ${table} WHERE ${column} = ?`;
        const [rows] = await dbPool.execute(sql, [value]);
        return rows;
      }
    }
  } catch (err) {
    console.error(`Database error in allQuery (${table}.${column}):`, err);
    throw err;
  }
}

export async function allRows(table) {
  const { pool: dbPool, driver: drv } = ensurePool();

  try {
    const sql = `SELECT * FROM ${table}`;
    if (drv === 'pg') {
      const result = await dbPool.query(sql);
      return result.rows;
    } else {
      const [rows] = await dbPool.execute(sql);
      return rows;
    }
  } catch (err) {
    console.error(`Database error in allRows (${table}):`, err);
    throw err;
  }
}

export async function customQuery(sql, params = []) {
  const { pool: dbPool, driver: drv } = ensurePool();

  try {
    if (drv === 'pg') {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const result = await dbPool.query(pgSql, params);
      return result.rows;
    } else {
      const [rows] = await dbPool.execute(sql, params);
      return rows;
    }
  } catch (err) {
    console.error('Database error in customQuery:', err);
    throw err;
  }
}

export function getPool() {
  return ensurePool();
}

initializePool();
