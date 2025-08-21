const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { name, contact, notes } = req.body;
  const stmt = db.prepare('INSERT INTO suppliers (name, contact, notes) VALUES (?, ?, ?)');
  const info = stmt.run(name, contact, notes);
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(info.lastInsertRowid);
  res.json(supplier);
});

router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, contact, notes } = req.body;
  db.prepare('UPDATE suppliers SET name = ?, contact = ?, notes = ? WHERE id = ?').run(name, contact, notes, id);
  res.json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
