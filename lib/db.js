import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';

const isProduction = process.env.NODE_ENV === 'production';
let db;

if (isProduction) {
  db = createClient(
    'https://zngfwjhxqrgoikvmwtfx.supabase.co', // replace with your Supabase URL
    process.env.SUPABASE_KEY                       // set in Vercel environment variables
  );
} else {
  db = new Database('database.db');
}

// --------------------- RUN QUERY ---------------------
// Supports insert, update, delete
export async function runQuery(table, values, action = 'insert', where = null) {
  if (isProduction) {
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
      const setKeys = Object.keys(values).map(k => `${k} = ?`).join(',');
      const stmt = db.prepare(
        `UPDATE ${table} SET ${setKeys} WHERE ${where.column} = ?`
      );
      return stmt.run(...Object.values(values), where.value);
    } else if (action === 'delete') {
      if (!where) throw new Error('WHERE clause required for delete');
      const stmt = db.prepare(`DELETE FROM ${table} WHERE ${where.column} = ?`);
      return stmt.run(where.value);
    }
  }
}

// --------------------- GET SINGLE ROW ---------------------
export async function getQuery(table, column, value) {
  if (isProduction) {
    const { data, error } = await db.from(table).select('*').eq(column, value).single();
    if (error) return null;
    return data;
  } else {
    return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).get(value);
  }
}

// --------------------- GET MULTIPLE ROWS ---------------------
export async function allQuery(table, column, value) {
  if (isProduction) {
    const { data, error } = await db.from(table).select('*').eq(column, value);
    if (error) return [];
    return data;
  } else {
    return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).all(value);
  }
}
