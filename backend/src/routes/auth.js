const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { secret } = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, full_name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const hash = await bcrypt.hash(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)');
    const info = stmt.run(username, hash, full_name || null);
    const user = db.prepare('SELECT id, username, full_name, role FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: 'User creation failed', details: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: row.id, username: row.username, role: row.role }, secret, { expiresIn: '8h' });
  res.json({ token, user: { id: row.id, username: row.username, full_name: row.full_name, role: row.role } });
});

module.exports = router;
