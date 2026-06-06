/**
 * Studio Store — map persistence via sql.js (WASM SQLite).
 * Zero native dependencies, works on all platforms.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import initSqlJs from "sql.js";

let _db = null;
let _dbPath = null;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Untitled Map',
    spec TEXT NOT NULL,
    revision TEXT NOT NULL DEFAULT '0',
    basemap_id TEXT NOT NULL DEFAULT 'none',
    audit_records TEXT NOT NULL DEFAULT '[]',
    review_decisions TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

const REQUIRED_COLUMNS = [
  { name: "basemap_id", definition: "TEXT NOT NULL DEFAULT 'none'" },
  { name: "audit_records", definition: "TEXT NOT NULL DEFAULT '[]'" },
  { name: "review_decisions", definition: "TEXT NOT NULL DEFAULT '[]'" },
];

export function resolveStorePath(env = process.env) {
  const configuredPath = env.STUDIO_DB_PATH?.trim();
  return configuredPath ? resolve(configuredPath) : join(homedir(), ".gis-engine", "studio", "studio.sqlite");
}

export function resetStoreForTests() {
  _db = null;
  _dbPath = null;
}

async function persistDb(db, dbPath = _dbPath) {
  if (!dbPath) return;
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, Buffer.from(db.export()));
}

async function openDatabase(SQL, dbPath) {
  try {
    const bytes = await readFile(dbPath);
    return new SQL.Database(bytes);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return new SQL.Database();
    }
    throw error;
  }
}

function tableColumns(db, tableName) {
  const result = db.exec(`PRAGMA table_info(${tableName})`);
  if (result.length === 0 || result[0].values.length === 0) return new Set();
  const nameIndex = result[0].columns.indexOf("name");
  return new Set(result[0].values.map((row) => String(row[nameIndex])));
}

function ensureSchema(db) {
  db.run(SCHEMA_SQL);
  const columns = tableColumns(db, "maps");
  for (const column of REQUIRED_COLUMNS) {
    if (!columns.has(column.name)) {
      db.run(`ALTER TABLE maps ADD COLUMN ${column.name} ${column.definition}`);
    }
  }
}

function parseStoredJson(value, fallback) {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : parsed;
  } catch {
    return fallback;
  }
}

function storedMapMetadata(row) {
  return {
    id: row.id,
    name: row.name,
    revision: row.revision,
    basemapId: typeof row.basemap_id === "string" && row.basemap_id.length > 0 ? row.basemap_id : "none",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    auditRecordCount: parseStoredJson(row.audit_records, []).length,
    reviewDecisionCount: parseStoredJson(row.review_decisions, []).length,
  };
}

async function getDb() {
  if (!_db) {
    const SQL = await initSqlJs();
    _dbPath = resolveStorePath();
    _db = await openDatabase(SQL, _dbPath);
    ensureSchema(_db);
    await persistDb(_db, _dbPath);
  }
  return _db;
}

export async function saveMap(input) {
  const db = await getDb();
  const { id, name, spec, revision, basemapId = "none", auditRecords = [], reviewDecisions = [] } = input;
  const json = JSON.stringify(spec);
  const serializedAuditRecords = JSON.stringify(auditRecords);
  const serializedReviewDecisions = JSON.stringify(reviewDecisions);
  const existing = db.exec("SELECT id FROM maps WHERE id = ?", [id]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(
      "UPDATE maps SET name = ?, spec = ?, revision = ?, basemap_id = ?, audit_records = ?, review_decisions = ?, updated_at = datetime('now') WHERE id = ?",
      [name, json, revision, basemapId, serializedAuditRecords, serializedReviewDecisions, id],
    );
  } else {
    db.run(
      "INSERT INTO maps (id, name, spec, revision, basemap_id, audit_records, review_decisions) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, json, revision, basemapId, serializedAuditRecords, serializedReviewDecisions],
    );
  }
  await persistDb(db);
  return {
    id,
    name,
    revision,
    basemapId,
    auditRecordCount: auditRecords.length,
    reviewDecisionCount: reviewDecisions.length,
  };
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
    ...storedMapMetadata(obj),
    spec: JSON.parse(obj.spec),
    auditRecords: parseStoredJson(obj.audit_records, []),
    reviewDecisions: parseStoredJson(obj.review_decisions, []),
  };
}

export async function listMaps() {
  const db = await getDb();
  const result = db.exec(
    "SELECT id, name, revision, basemap_id, audit_records, review_decisions, created_at, updated_at FROM maps ORDER BY updated_at DESC",
  );
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj = {};
    cols.forEach((c, i) => {
      obj[c] = row[i];
    });
    return storedMapMetadata(obj);
  });
}

export async function deleteMap(id) {
  const db = await getDb();
  db.run("DELETE FROM maps WHERE id = ?", [id]);
  await persistDb(db);
}
