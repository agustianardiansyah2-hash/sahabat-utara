import Database from 'better-sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const dbPath = join(__dirname, '..', 'db', 'sahabat_utara.db');

// Ensure db directory exists
const dbDir = join(__dirname, '..', 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

let db = null;

// Initialize SQLite database
export function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      console.log('📂 SQLite connected successfully');

      // Create tables
      createTables();

      console.log('✅ Database initialized successfully');
      resolve(db);
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      reject(error);
    }
  });
}

// Create all tables
function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS monitoring_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rw TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitoring_point_id INTEGER,
      rw TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      category TEXT NOT NULL,
      water_level INTEGER NOT NULL,
      description TEXT,
      photo_url TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (monitoring_point_id) REFERENCES monitoring_points(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitoring_point_id INTEGER NOT NULL,
      water_level REAL NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (monitoring_point_id) REFERENCES monitoring_points(id)
    )`,

    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      cctv_url_1 TEXT,
      cctv_url_2 TEXT,
      cctv_url_3 TEXT,
      cctv_url_4 TEXT,
      threshold_red INTEGER DEFAULT 80,
      threshold_yellow INTEGER DEFAULT 40,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS evacuation_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      rw TEXT NOT NULL,
      capacity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      contact_person TEXT,
      contact_phone TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS evacuees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evacuation_center_id INTEGER,
      name TEXT NOT NULL,
      nik TEXT,
      age INTEGER,
      gender TEXT,
      category TEXT NOT NULL,
      needs TEXT,
      health_condition TEXT,
      notes TEXT,
      arrival_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (evacuation_center_id) REFERENCES evacuation_centers(id)
    )`,

    `CREATE TABLE IF NOT EXISTS population_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rw TEXT NOT NULL,
      total_population INTEGER DEFAULT 0,
      total_kk INTEGER DEFAULT 0,
      laki_laki INTEGER DEFAULT 0,
      perempuan INTEGER DEFAULT 0,
      bayi INTEGER DEFAULT 0,
      balita INTEGER DEFAULT 0,
      anak INTEGER DEFAULT 0,
      remaja INTEGER DEFAULT 0,
      dewasa INTEGER DEFAULT 0,
      lansia INTEGER DEFAULT 0,
      ibu_hamil INTEGER DEFAULT 0,
      disabilitas INTEGER DEFAULT 0,
      year INTEGER DEFAULT 2026,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      rw_access TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tables) {
    try {
      db.exec(sql);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Table creation error:', error.message);
      }
    }
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_reports_rw ON reports(rw)',
    'CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category)',
    'CREATE INDEX IF NOT EXISTS idx_sensor_readings_point ON sensor_readings(monitoring_point_id)',
    'CREATE INDEX IF NOT EXISTS idx_evacuees_center ON evacuees(evacuation_center_id)',
    'CREATE INDEX IF NOT EXISTS idx_evacuees_category ON evacuees(category)',
    'CREATE INDEX IF NOT EXISTS idx_population_rw ON population_data(rw)'
  ];

  for (const sql of indexes) {
    try {
      db.exec(sql);
    } catch (error) {
      // Ignore index errors
    }
  }

  // Insert default settings if not exists
  try {
    const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!row) {
      db.prepare('INSERT INTO settings (id) VALUES (1)').run();
    }
  } catch (error) {
    // Ignore
  }

  // Insert default admin user if not exists
  try {
    const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    if (!admin) {
      // Password: admin123 (hashed with SHA256)
      const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
      db.prepare(`
        INSERT INTO users (username, password, name, role, status)
        VALUES ('admin', ?, 'Super Admin', 'super_admin', 'active')
      `).run(hashedPassword);
      console.log('✅ Default admin user created (admin/admin123)');
    }
  } catch (error) {
    // Ignore
  }
}

// Get database instance
export function getPool() {
  return db;
}

// Helper to run SELECT query and return results as array of objects
export async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        resolve(stmt.all(...params));
      } else {
        resolve(stmt.run(...params));
      }
    } catch (error) {
      console.error('Query error:', error);
      reject(error);
    }
  });
}

// Helper to run SELECT query and return first result
export async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Helper to run INSERT/UPDATE/DELETE and return result info
export async function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const cleanParams = params.map(p => p === undefined ? null : p);
      const stmt = db.prepare(sql);
      const result = stmt.run(...cleanParams);
      resolve({
        lastInsertRowid: result.lastInsertRowid,
        changes: result.changes
      });
    } catch (error) {
      console.error('Run error:', error);
      reject(error);
    }
  });
}

// Save database (no-op for SQLite, auto-saves)
export function saveDatabase() {
  return Promise.resolve();
}

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('📂 SQLite connection closed');
  }
}

export default { initDatabase, getPool, query, queryOne, run, saveDatabase, closeDatabase };
