const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM recipients ORDER BY name').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { name, contact, notes } = req.body;
  const stmt = db.prepare('INSERT INTO recipients (name, contact, notes) VALUES (?, ?, ?)');
  const info = stmt.run(name, contact, notes);
  res.json(db.prepare('SELECT * FROM recipients WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, contact, notes } = req.body;
  db.prepare('UPDATE recipients SET name = ?, contact = ?, notes = ? WHERE id = ?').run(name, contact, notes, id);
  res.json(db.prepare('SELECT * FROM recipients WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM recipients WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
