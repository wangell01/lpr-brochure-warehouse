const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const QRCode = require('qrcode');
const dotenv = require('dotenv');
dotenv.config();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = express.Router();

function getBaseAppUrl() {
  return process.env.BASE_APP_URL || `http://localhost:${process.env.PORT || 4000}`;
}

async function generateQrImage(textOrUrl) {
  if (!textOrUrl) return null;
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `qr-${unique}.png`;
  const filePath = path.join(uploadDir, filename);
  try {
    await QRCode.toFile(filePath, String(textOrUrl), { type: 'png', margin: 2 });
    return '/uploads/' + filename;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return null;
  }
}

function removeFileIfExists(relPath) {
  if (!relPath) return;
  try {
    const abs = path.join(__dirname, '..', relPath.replace(/^\/+/, ''));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn('Failed to remove file', relPath, e.message);
  }
}

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, s.name AS supplier_name
    FROM brochures b
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    ORDER BY b.title
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM brochures WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const { title, supplier_id, description, qr_text, qr_url } = req.body;
  const image_path = req.file ? '/uploads/' + path.basename(req.file.path) : null;
  const info = db.prepare('INSERT INTO brochures (title, supplier_id, description, image_path) VALUES (?, ?, ?, ?)').run(
    title, supplier_id || null, description || null, image_path
  );
  const id = info.lastInsertRowid;

  // decide QR content: prefer qr_text, then qr_url, otherwise default to brochure page URL
  const base = getBaseAppUrl();
  const defaultUrl = `${base}/brochures/${id}`;
  const qrContent = qr_text || qr_url || defaultUrl;

  const qr_path = await generateQrImage(qrContent);
  if (qr_path) {
    db.prepare('UPDATE brochures SET qr_code_path = ? WHERE id = ?').run(qr_path, id);
  }

  const bro = db.prepare('SELECT * FROM brochures WHERE id = ?').get(id);
  res.json(bro);
});

router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  const id = req.params.id;
  const { title, supplier_id, description, qr_text, qr_url, qr_clear } = req.body;
  const bro = db.prepare('SELECT * FROM brochures WHERE id = ?').get(id);
  if (!bro) return res.status(404).json({ error: 'Not found' });

  let image_path = bro.image_path;
  if (req.file) image_path = '/uploads/' + path.basename(req.file.path);

  // Handle QR edits:
  let qr_code_path = bro.qr_code_path || null;
  if (qr_clear && qr_clear !== 'false') {
    // remove existing QR file and clear path
    removeFileIfExists(qr_code_path);
    qr_code_path = null;
  } else if (qr_text || qr_url) {
    // generate new QR and replace existing file
    // remove old file first
    removeFileIfExists(qr_code_path);
    const base = getBaseAppUrl();
    const defaultUrl = `${base}/brochures/${id}`;
    const qrContent = qr_text || qr_url || defaultUrl;
    const newQr = await generateQrImage(qrContent);
    qr_code_path = newQr;
  }

  db.prepare('UPDATE brochures SET title = ?, supplier_id = ?, description = ?, image_path = ?, qr_code_path = ? WHERE id = ?')
    .run(title, supplier_id || null, description || null, image_path, qr_code_path, id);

  res.json(db.prepare('SELECT * FROM brochures WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  // remove associated files (image and qr) safely
  const bro = db.prepare('SELECT * FROM brochures WHERE id = ?').get(req.params.id);
  if (bro) {
    if (bro.image_path) removeFileIfExists(bro.image_path);
    if (bro.qr_code_path) removeFileIfExists(bro.qr_code_path);
  }
  db.prepare('DELETE FROM brochures WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
