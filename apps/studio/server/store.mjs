/**
 * Studio Store — map persistence via sql.js (WASM SQLite).
 * Zero native dependencies, works on all platforms.
 */

import initSqlJs from "sql.js";

let _db = null;

async function getDb() {
  if (!_db) {
    const SQL = await initSqlJs();
    _db = new SQL.Database();
    _db.run(`
      CREATE TABLE IF NOT EXISTS maps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Untitled Map',
        spec TEXT NOT NULL,
        revision TEXT NOT NULL DEFAULT '0',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return _db;
}

export async function saveMap(id, name, spec, revision) {
  const db = await getDb();
  const json = JSON.stringify(spec);
  const existing = db.exec("SELECT id FROM maps WHERE id = ?", [id]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(
      "UPDATE maps SET name = ?, spec = ?, revision = ?, updated_at = datetime('now') WHERE id = ?",
      [name, json, revision, id],
    );
  } else {
    db.run("INSERT INTO maps (id, name, spec, revision) VALUES (?, ?, ?, ?)", [
      id,
      name,
      json,
      revision,
    ]);
  }
  return { id, name, revision };
}

export async function loadMap(id) {
  const db = await getDb();
  const result = db.exec("SELECT * FROM maps WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const cols = result[0].columns;
  const row = result[0].values[0];
  const obj = {};
  cols.forEach((c, i) => {
    obj[c] = row[i];
  });
  return {
    id: obj.id,
    name: obj.name,
    spec: JSON.parse(obj.spec),
    revision: obj.revision,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
  };
}

export async function listMaps() {
  const db = await getDb();
  const result = db.exec(
    "SELECT id, name, revision, created_at, updated_at FROM maps ORDER BY updated_at DESC",
  );
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj = {};
    cols.forEach((c, i) => {
      obj[c] = row[i];
    });
    return {
      id: obj.id,
      name: obj.name,
      revision: obj.revision,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
    };
  });
}

export async function deleteMap(id) {
  const db = await getDb();
  db.run("DELETE FROM maps WHERE id = ?", [id]);
}
