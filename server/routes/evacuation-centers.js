import express from 'express';
import { query, queryOne, run } from '../db/database.js';
import { authenticate, getAccessibleRWs } from '../middleware/auth.js';

const router = express.Router();

function canDelete(user) {
  return user?.role === 'super_admin';
}

// Allow PIC RW to edit their own RW's data
function canEdit(user, centerRw) {
  const accessibleRWs = getAccessibleRWs(user);
  if (user?.role === 'super_admin') return true;
  if (user?.role === 'pic_rw' && accessibleRWs.includes(centerRw)) return true;
  return false;
}

// GET all evacuation centers
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, rw } = req.query;
    const accessibleRWs = getAccessibleRWs(req.user);

    let sql = `SELECT ec.*, (SELECT COUNT(*) FROM evacuees WHERE evacuation_center_id = ec.id AND status = 'active') as evacuee_count FROM evacuation_centers ec WHERE 1=1`;
    const params = [];

    // PIC RW can only see their RW centers
    if (req.user.role === 'pic_rw') {
      if (!accessibleRWs || accessibleRWs.length === 0) {
        return res.json({ success: true, data: [] });
      }
      sql += ' AND ec.rw IN (' + accessibleRWs.map(() => '?').join(',') + ')';
      params.push(...accessibleRWs);
    }

    if (status) {
      sql += ' AND ec.status = ?';
      params.push(status);
    }
    if (rw && (req.user.role === 'super_admin' || accessibleRWs.includes(rw))) {
      sql += ' AND ec.rw = ?';
      params.push(rw);
    }
    sql += ' ORDER BY ec.name';

    const centers = await query(sql, params);
    res.json({ success: true, data: centers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single evacuation center
router.get('/:id', authenticate, async (req, res) => {
  try {
    const center = await queryOne(`SELECT ec.*, (SELECT COUNT(*) FROM evacuees WHERE evacuation_center_id = ec.id AND status = 'active') as evacuee_count FROM evacuation_centers ec WHERE ec.id = ?`, [req.params.id]);
    if (!center) {
      return res.status(404).json({ success: false, error: 'Center not found' });
    }

    const accessibleRWs = getAccessibleRWs(req.user);
    if (req.user.role === 'pic_rw' && !accessibleRWs.includes(center.rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke data ini' });
    }

    res.json({ success: true, data: center });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create evacuation center (PIC RW can create)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, address, rw, capacity, contact_person, contact_phone, latitude, longitude } = req.body;

    if (!name || !rw) {
      return res.status(400).json({ success: false, error: 'Nama dan RW wajib diisi' });
    }

    const accessibleRWs = getAccessibleRWs(req.user);
    if (req.user.role === 'pic_rw' && !accessibleRWs.includes(rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses untuk membuat pos evakuasi di RW ini' });
    }

    const result = await run(
      'INSERT INTO evacuation_centers (name, address, rw, capacity, contact_person, contact_phone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, address, rw, capacity || 0, contact_person, contact_phone, latitude, longitude]
    );
    const newCenter = await queryOne('SELECT * FROM evacuation_centers WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newCenter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update evacuation center (PIC RW can edit their own RW, Super Admin can edit all)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT * FROM evacuation_centers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Center not found' });
    }

    // Check if user can edit this center
    if (!canEdit(req.user, existing.rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses untuk mengubah data ini' });
    }

    const { name, address, rw, capacity, status, contact_person, contact_phone, latitude, longitude } = req.body;

    // PIC RW cannot change the RW field
    const newRw = req.user.role === 'pic_rw' ? existing.rw : (rw || existing.rw);

    await run(
      'UPDATE evacuation_centers SET name = ?, address = ?, rw = ?, capacity = ?, status = ?, contact_person = ?, contact_phone = ?, latitude = ?, longitude = ? WHERE id = ?',
      [
        name || existing.name,
        address || existing.address,
        newRw,
        capacity ?? existing.capacity,
        req.user.role === 'pic_rw' ? existing.status : (status || existing.status),
        contact_person || existing.contact_person,
        contact_phone || existing.contact_phone,
        latitude ?? existing.latitude,
        longitude ?? existing.longitude,
        id
      ]
    );
    const updated = await queryOne('SELECT * FROM evacuation_centers WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE evacuation center (Super Admin only - PIC RW cannot delete)
router.delete('/:id', authenticate, async (req, res) => {
  if (!canDelete(req.user)) {
    return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa menghapus data' });
  }

  try {
    await run('DELETE FROM evacuation_centers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pos evakuasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
