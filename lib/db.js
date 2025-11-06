import { createClient } from '@supabase/supabase-js';

const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
let db;
let Database;
let useSupabase = false;

if (isProduction || isVercel) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    console.error('Current environment variables:', {
      SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_KEY: supabaseKey ? 'SET' : 'MISSING',
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV
    });
    db = null;
    useSupabase = true;
  } else {
    try {
      db = createClient(supabaseUrl, supabaseKey);
      useSupabase = true;
      console.log('✅ Supabase client initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize Supabase client:', err);
      db = null;
      useSupabase = true;
    }
  }
} else {
  const BetterSqlite3 = await import('better-sqlite3');
  Database = BetterSqlite3.default;
  db = new Database('database.db');
  useSupabase = false;
}

export async function runQuery(table, values, action = 'insert', where = null) {
  if (useSupabase) {
    if (!db) {
      throw new Error('Database not initialized. Please check SUPABASE_URL and SUPABASE_KEY environment variables.');
    }
    if (action === 'insert') {
      const { data, error } = await db.from(table).insert(values).select();
      if (error) throw error;
      return data[0];
    } else if (action === 'update') {
      if (!where) throw new Error('WHERE clause required for update');
      const { column, value } = where;
      const { data, error } = await db.from(table).update(values).eq(column, value).select();
      if (error) throw error;
      return data[0];
    } else if (action === 'delete') {
      if (!where) throw new Error('WHERE clause required for delete');
      const { column, value } = where;
      const { error } = await db.from(table).delete().eq(column, value);
      if (error) throw error;
      return { success: true };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } else {
    if (action === 'insert') {
      const keys = Object.keys(values);
      const vals = Object.values(values);
      const placeholders = keys.map(() => '?').join(',');
      const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
      return stmt.run(...vals);
    } else if (action === 'update') {
      if (!where) throw new Error('WHERE clause required for update');
      const setKeys = Object.keys(values).map(k => `${k} = ?`).join(', ');
      const stmt = db.prepare(`UPDATE ${table} SET ${setKeys} WHERE ${where.column} = ?`);
      return stmt.run(...Object.values(values), where.value);
    } else if (action === 'delete') {
      if (!where) throw new Error('WHERE clause required for delete');
      const stmt = db.prepare(`DELETE FROM ${table} WHERE ${where.column} = ?`);
      return stmt.run(where.value);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  }
}

export async function getQuery(table, column, value) {
  if (useSupabase) {
    if (!db) {
      throw new Error('Database not initialized. Please check SUPABASE_URL and SUPABASE_KEY environment variables.');
    }
    const { data, error } = await db.from(table).select('*').eq(column, value).single();
    if (error) return null;
    return data;
  } else {
    return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).get(value);
  }
}

export async function allQuery(table, column, value) {
  if (useSupabase) {
    if (!db) {
      throw new Error('Database not initialized. Please check SUPABASE_URL and SUPABASE_KEY environment variables.');
    }
    const { data, error } = await db.from(table).select('*').eq(column, value);
    if (error) return [];
    return data;
  } else {
    return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).all(value);
  }
}

export async function allRows(table) {
  if (useSupabase) {
    const { data, error } = await db.from(table).select('*');
    if (error) return [];
    return data;
  } else {
    return db.prepare(`SELECT * FROM ${table}`).all();
  }
}
