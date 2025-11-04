import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';

const isProduction = process.env.NODE_ENV === 'production';
let db;

if (isProduction) {
  db = createClient(
    'https://zngfwjhxqrgoikvmwtfx.supabase.co',
    process.env.SUPABASE_KEY
  );
} else {
  db = new Database('database.db');
}

export async function runQuery(table, values) {
  if (isProduction) {
    const { data, error } = await db.from(table).insert(values).select();
    if (error) throw error;
    return data[0];
  } else {
    const keys = Object.keys(values);
    const vals = Object.values(values);
    const placeholders = keys.map(() => '?').join(',');
    return db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`).run(...vals);
  }
}

export async function getQuery(table, column, value) {
  if (isProduction) {
    const { data, error } = await db.from(table).select('*').eq(column, value).single();
    if (error) return null;
    return data;
  } else {
    return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).get(value);
  }
}

export async function allQuery(table, column, value) {
  if (isProduction) {
    const { data, error } = await db.from(table).select('*').eq(column, value);
    if (error) return [];
    return data;
  } else {
    return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).all(value);
  }
}
