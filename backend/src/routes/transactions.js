const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

/*
POST /api/transactions
body: { brochure_id, cabinet_id, type: "in"|"out", quantity, note }
This will:
- create a transaction row
- update or insert inventory_items row (increase for "in", decrease for "out")
*/
router.post('/', requireAuth, (req, res) => {
  const { brochure_id, cabinet_id, type, quantity, note } = req.body;
  if (!brochure_id || !cabinet_id || !type || !quantity) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be positive integer' });

  const tr = db.prepare('INSERT INTO transactions (brochure_id, cabinet_id, user_id, type, quantity, note) VALUES (?, ?, ?, ?, ?, ?)').run(
    brochure_id, cabinet_id, req.user?.id || null, type, qty, note || null
  );

  // Update inventory
  const inv = db.prepare('SELECT * FROM inventory_items WHERE brochure_id = ? AND cabinet_id = ?').get(brochure_id, cabinet_id);
  let newQty = (inv ? inv.quantity : 0) + (type === 'in' ? qty : -qty);
  if (newQty < 0) newQty = 0;
  if (inv) {
    db.prepare('UPDATE inventory_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newQty, inv.id);
  } else {
    db.prepare('INSERT INTO inventory_items (brochure_id, cabinet_id, quantity) VALUES (?, ?, ?)').run(brochure_id, cabinet_id, newQty);
  }

  res.json({ success: true, transaction_id: tr.lastInsertRowid, new_quantity: newQty });
});

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, b.title AS brochure_title, c.name AS cabinet_name, u.username AS user_name
    FROM transactions t
    LEFT JOIN brochures b ON t.brochure_id = b.id
    LEFT JOIN cabinets c ON t.cabinet_id = c.id
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    LIMIT 100
  `).all();
  res.json(rows);
});

router.get('/inventory', (req, res) => {
  const rows = db.prepare(`
    SELECT ii.*, b.title AS brochure_title, c.name AS cabinet_name
    FROM inventory_items ii
    JOIN brochures b ON ii.brochure_id = b.id
    JOIN cabinets c ON ii.cabinet_id = c.id
    ORDER BY b.title, c.name
  `).all();
  res.json(rows);
});

module.exports = router;
