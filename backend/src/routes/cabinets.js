const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM cabinets ORDER BY name').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { name, location, notes } = req.body;
  const info = db.prepare('INSERT INTO cabinets (name, location, notes) VALUES (?, ?, ?)').run(name, location, notes);
  res.json(db.prepare('SELECT * FROM cabinets WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, location, notes } = req.body;
  db.prepare('UPDATE cabinets SET name = ?, location = ?, notes = ? WHERE id = ?').run(name, location, notes, id);
  res.json(db.prepare('SELECT * FROM cabinets WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cabinets WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
