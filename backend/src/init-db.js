// Run once to create tables and ensure qr_code_path column exists
const db = require('./db');

function run(sql) {
  db.exec(sql);
}

const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cabinets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brochures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  supplier_id INTEGER,
  description TEXT,
  image_path TEXT,
  qr_code_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brochure_id INTEGER NOT NULL,
  cabinet_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brochure_id) REFERENCES brochures(id) ON DELETE CASCADE,
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE CASCADE,
  UNIQUE(brochure_id, cabinet_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brochure_id INTEGER NOT NULL,
  cabinet_id INTEGER NOT NULL,
  user_id INTEGER,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brochure_id) REFERENCES brochures(id),
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

run(schema);

// For existing DBs: ensure qr_code_path column exists on brochures table
(function ensureQrColumn() {
  const row = db.prepare("PRAGMA table_info('brochures')").all();
  const hasQr = row.some(r => r.name === 'qr_code_path');
  if (!hasQr) {
    console.log('Adding qr_code_path column to brochures table...');
    try {
      db.exec("ALTER TABLE brochures ADD COLUMN qr_code_path TEXT");
      console.log('qr_code_path column added.');
    } catch (err) {
      console.error('Failed to add qr_code_path column:', err.message);
    }
  } else {
    console.log('qr_code_path column already exists.');
  }
})();
console.log('Database initialization finished (backend/data.db).');
process.exit(0);
