import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query, queryOne, run } from '../db/database.js';
import { authenticate, getAccessibleRWs } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${uuidv4()}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Helper: Check if user can edit/delete
function canEditDelete(user) {
  return user?.role === 'super_admin';
}

// GET all reports
router.get('/', authenticate, async (req, res) => {
  try {
    const { rw, category, startDate, endDate, limit = 100 } = req.query;
    const accessibleRWs = getAccessibleRWs(req.user);

    let sql = 'SELECT r.*, mp.name as monitoring_point_name FROM reports r LEFT JOIN monitoring_points mp ON r.monitoring_point_id = mp.id WHERE 1=1';
    const params = [];

    // Filter by accessible RW for PIC RW
    if (req.user.role === 'pic_rw') {
      sql += ' AND r.rw IN (' + accessibleRWs.map(() => '?').join(',') + ')';
      params.push(...accessibleRWs);
    }

    if (rw) {
      sql += ' AND r.rw = ?';
      params.push(rw);
    }

    if (category) {
      sql += ' AND r.category = ?';
      params.push(category);
    }

    if (startDate) {
      sql += ' AND r.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND r.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const reports = await query(sql, params);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET reports by RW
router.get('/rw/:rw', authenticate, async (req, res) => {
  try {
    const accessibleRWs = getAccessibleRWs(req.user);

    if (req.user.role === 'pic_rw' && !accessibleRWs.includes(req.params.rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke RW ini' });
    }

    const reports = await query(
      'SELECT * FROM reports WHERE rw = ? ORDER BY created_at DESC',
      [req.params.rw]
    );
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET annual reports
router.get('/annual/:year', authenticate, async (req, res) => {
  try {
    const accessibleRWs = getAccessibleRWs(req.user);

    let sql = 'SELECT * FROM reports WHERE YEAR(created_at) = ?';
    const params = [req.params.year];

    if (req.user.role === 'pic_rw') {
      sql += ' AND rw IN (' + accessibleRWs.map(() => '?').join(',') + ')';
      params.push(...accessibleRWs);
    }

    sql += ' ORDER BY created_at DESC';

    const reports = await query(sql, params);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single report
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await queryOne(
      'SELECT r.*, mp.name as monitoring_point_name FROM reports r LEFT JOIN monitoring_points mp ON r.monitoring_point_id = mp.id WHERE r.id = ?',
      [req.params.id]
    );
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const accessibleRWs = getAccessibleRWs(req.user);
    if (req.user.role === 'pic_rw' && !accessibleRWs.includes(report.rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke data ini' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create report (PIC RW can create)
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { rw, reporter_name, category, water_level, description, latitude, longitude, monitoring_point_id } = req.body;

    if (!rw || !reporter_name || !category || water_level === undefined) {
      return res.status(400).json({ success: false, error: 'Field wajib tidak boleh kosong' });
    }

    const accessibleRWs = getAccessibleRWs(req.user);
    if (req.user.role === 'pic_rw' && !accessibleRWs.includes(rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses untuk membuat laporan di RW ini' });
    }

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await run(
      'INSERT INTO reports (rw, reporter_name, category, water_level, description, photo_url, latitude, longitude, monitoring_point_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [rw, reporter_name, category, parseInt(water_level), description, photo_url, latitude, longitude, monitoring_point_id]
    );

    const newReport = await queryOne('SELECT * FROM reports WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newReport });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE report (Super Admin only)
router.delete('/:id', authenticate, async (req, res) => {
  if (!canEditDelete(req.user)) {
    return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa menghapus data' });
  }

  try {
    await run('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Laporan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
