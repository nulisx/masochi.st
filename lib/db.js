import mysql from 'mysql2/promise';

let pool;
let initAttempted = false;
let initError = null;

// Check if MariaDB credentials are available
const mariadbConfig = {
  host: process.env.MARIADB_HOST,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  port: process.env.MARIADB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Lazy initialization function
function initializePool() {
  if (initAttempted) return;
  initAttempted = true;

  if (mariadbConfig.host && mariadbConfig.user && mariadbConfig.password && mariadbConfig.database) {
    try {
      pool = mysql.createPool(mariadbConfig);
      console.log('✅ MariaDB connection pool initialized successfully');
      console.log(`📊 Database: ${mariadbConfig.database} on ${mariadbConfig.host}:${mariadbConfig.port}`);
    } catch (err) {
      initError = err;
      console.error('❌ Failed to initialize MariaDB pool:', err);
    }
  } else {
    initError = new Error('MariaDB configuration is incomplete');
    console.warn('⚠️ WARNING: Missing MariaDB environment variables');
    console.warn('Required variables: MARIADB_HOST, MARIADB_USER, MARIADB_PASSWORD, MARIADB_DATABASE');
    console.warn('Database operations will fail until credentials are configured.');
    console.warn('Current environment variables:', {
      MARIADB_HOST: mariadbConfig.host ? 'SET' : 'MISSING',
      MARIADB_USER: mariadbConfig.user ? 'SET' : 'MISSING',
      MARIADB_PASSWORD: mariadbConfig.password ? 'SET' : 'MISSING',
      MARIADB_DATABASE: mariadbConfig.database ? 'SET' : 'MISSING',
      MARIADB_PORT: mariadbConfig.port
    });
  }
}

// Helper function to ensure pool is initialized
function ensurePool() {
  if (!initAttempted) {
    initializePool();
  }
  
  if (initError) {
    throw new Error(`Database not available: ${initError.message}. Please configure MARIADB_HOST, MARIADB_USER, MARIADB_PASSWORD, and MARIADB_DATABASE environment variables.`);
  }
  
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  return pool;
}

export async function runQuery(table, values, action = 'insert', where = null) {
  const dbPool = ensurePool();
  let connection;
  
  try {
    connection = await dbPool.getConnection();
    
    if (action === 'insert') {
      const keys = Object.keys(values);
      const vals = Object.values(values);
      const placeholders = keys.map(() => '?').join(',');
      const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
      const [result] = await connection.execute(sql, vals);
      return { id: result.insertId, lastInsertRowid: result.insertId, ...values };
    } else if (action === 'update') {
      if (!where) throw new Error('WHERE clause required for update');
      const setKeys = Object.keys(values).map(k => `${k} = ?`).join(', ');
      const sql = `UPDATE ${table} SET ${setKeys} WHERE ${where.column} = ?`;
      const [result] = await connection.execute(sql, [...Object.values(values), where.value]);
      return { affectedRows: result.affectedRows, ...values };
    } else if (action === 'delete') {
      if (!where) throw new Error('WHERE clause required for delete');
      const sql = `DELETE FROM ${table} WHERE ${where.column} = ?`;
      const [result] = await connection.execute(sql, [where.value]);
      return { success: true, affectedRows: result.affectedRows };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    console.error(`Database error in runQuery (${action} on ${table}):`, err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

export async function getQuery(table, column, value) {
  const dbPool = ensurePool();
  let connection;
  
  try {
    connection = await dbPool.getConnection();
    const sql = `SELECT * FROM ${table} WHERE ${column} = ? LIMIT 1`;
    const [rows] = await connection.execute(sql, [value]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error(`Database error in getQuery (${table}.${column}):`, err);
    return null;
  } finally {
    if (connection) connection.release();
  }
}

export async function allQuery(table, column, value) {
  const dbPool = ensurePool();
  let connection;
  
  try {
    connection = await dbPool.getConnection();
    const sql = `SELECT * FROM ${table} WHERE ${column} = ?`;
    const [rows] = await connection.execute(sql, [value]);
    return rows;
  } catch (err) {
    console.error(`Database error in allQuery (${table}.${column}):`, err);
    return [];
  } finally {
    if (connection) connection.release();
  }
}

export async function allRows(table) {
  const dbPool = ensurePool();
  let connection;
  
  try {
    connection = await dbPool.getConnection();
    const sql = `SELECT * FROM ${table}`;
    const [rows] = await connection.execute(sql);
    return rows;
  } catch (err) {
    console.error(`Database error in allRows (${table}):`, err);
    return [];
  } finally {
    if (connection) connection.release();
  }
}

export async function customQuery(sql, params = []) {
  const dbPool = ensurePool();
  let connection;
  
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('Database error in customQuery:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

export function getPool() {
  return ensurePool();
}

// Initialize on first import (but don't throw)
initializePool();
