import express from 'express';
import { query, queryOne, run } from '../db/database.js';
import { authenticate, getAccessibleRWs } from '../middleware/auth.js';

const router = express.Router();

function canDelete(user) {
  return user?.role === 'super_admin';
}

function canEditEvacuee(user, evacuee) {
  if (user?.role === 'super_admin') return true;
  if (user?.role === 'pic_rw') {
    const accessibleRWs = getAccessibleRWs(user);
    return evacuee.center_rw && accessibleRWs.includes(evacuee.center_rw);
  }
  return false;
}

async function getAccessibleCenters(req) {
  const accessibleRWs = getAccessibleRWs(req.user);

  if (req.user.role === 'super_admin') {
    return null;
  }

  if (!accessibleRWs || accessibleRWs.length === 0) {
    return [];
  }

  const centers = await query('SELECT id FROM evacuation_centers WHERE rw IN (' + accessibleRWs.map(() => '?').join(',') + ')', accessibleRWs);
  return centers.map(c => c.id);
}

// GET all evacuees
router.get('/', authenticate, async (req, res) => {
  try {
    const { center_id, category, status } = req.query;
    const accessibleCenters = await getAccessibleCenters(req);

    if (accessibleCenters !== null && accessibleCenters.length === 0) {
      return res.json({ success: true, data: [] });
    }

    let sql = 'SELECT e.*, ec.name as center_name, ec.rw as center_rw FROM evacuees e LEFT JOIN evacuation_centers ec ON e.evacuation_center_id = ec.id WHERE 1=1';
    const params = [];

    if (accessibleCenters !== null) {
      sql += ' AND e.evacuation_center_id IN (' + accessibleCenters.map(() => '?').join(',') + ')';
      params.push(...accessibleCenters);
    }

    if (center_id) {
      sql += ' AND e.evacuation_center_id = ?';
      params.push(center_id);
    }
    if (category) {
      sql += ' AND e.category = ?';
      params.push(category);
    }
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY e.created_at DESC';

    const evacuees = await query(sql, params);
    res.json({ success: true, data: evacuees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET special needs analysis by evacuation center (must be before /:id)
router.get('/needs-by-center', authenticate, async (req, res) => {
  try {
    const accessibleCenters = await getAccessibleCenters(req);

    // Get all evacuation centers with their evacuees grouped by category
    let centerQuery = `
      SELECT
        ec.id as center_id,
        ec.name as center_name,
        ec.address,
        ec.rw,
        ec.capacity,
        ec.contact_person,
        ec.contact_phone,
        COUNT(e.id) as total_pengungsi,
        SUM(CASE WHEN e.category = 'bayi' THEN 1 ELSE 0 END) as jumlah_bayi,
        SUM(CASE WHEN e.category = 'balita' THEN 1 ELSE 0 END) as jumlah_balita,
        SUM(CASE WHEN e.category = 'anak' THEN 1 ELSE 0 END) as jumlah_anak,
        SUM(CASE WHEN e.category = 'remaja' THEN 1 ELSE 0 END) as jumlah_remaja,
        SUM(CASE WHEN e.category = 'dewasa' THEN 1 ELSE 0 END) as jumlah_dewasa,
        SUM(CASE WHEN e.category = 'lansia' THEN 1 ELSE 0 END) as jumlah_lansia,
        SUM(CASE WHEN e.category = 'ibu_hamil' THEN 1 ELSE 0 END) as jumlah_ibu_hamil,
        SUM(CASE WHEN e.category = 'disabilitas' THEN 1 ELSE 0 END) as jumlah_disabilitas
      FROM evacuation_centers ec
      LEFT JOIN evacuees e ON ec.id = e.evacuation_center_id AND e.status = 'active'
    `;

    let params = [];
    if (accessibleCenters !== null) {
      centerQuery += ' WHERE ec.id IN (' + accessibleCenters.map(() => '?').join(',') + ')';
      params.push(...accessibleCenters);
    }
    centerQuery += ' GROUP BY ec.id ORDER BY ec.rw';

    const centers = await query(centerQuery, params);

    // Get detailed needs for each center
    const detailedNeeds = await query(`
      SELECT
        e.evacuation_center_id,
        e.category,
        e.needs,
        e.health_condition,
        e.name,
        e.age,
        e.gender
      FROM evacuees e
      WHERE e.status = 'active'
      AND e.category IN ('bayi', 'balita', 'lansia', 'ibu_hamil', 'disabilitas')
      ${accessibleCenters !== null ? 'AND e.evacuation_center_id IN (' + accessibleCenters.map(() => '?').join(',') + ')' : ''}
      ORDER BY e.evacuation_center_id, e.category
    `, accessibleCenters !== null ? accessibleCenters : []);

    // Group detailed needs by center
    const needsByCenter = {};
    for (const evac of detailedNeeds) {
      if (!needsByCenter[evac.evacuation_center_id]) {
        needsByCenter[evac.evacuation_center_id] = [];
      }
      needsByCenter[evac.evacuation_center_id].push({
        nama: evac.name,
        kategori: evac.category,
        usia: evac.age,
        jenis_kelamin: evac.gender,
        kebutuhan: evac.needs,
        kondisi_kesehatan: evac.health_condition
      });
    }

    // Calculate totals
    const totals = {
      total_pengungsi: 0,
      bayi: 0,
      balita: 0,
      anak: 0,
      remaja: 0,
      dewasa: 0,
      lansia: 0,
      ibu_hamil: 0,
      disabilitas: 0
    };

    const result = centers.map(center => {
      totals.total_pengungsi += center.total_pengungsi;
      totals.bayi += center.jumlah_bayi;
      totals.balita += center.jumlah_balita;
      totals.anak += center.jumlah_anak;
      totals.remaja += center.jumlah_remaja;
      totals.dewasa += center.jumlah_dewasa;
      totals.lansia += center.jumlah_lansia;
      totals.ibu_hamil += center.jumlah_ibu_hamil;
      totals.disabilitas += center.jumlah_disabilitas;

      return {
        ...center,
        detail_kebutuhan: needsByCenter[center.center_id] || []
      };
    });

    res.json({
      success: true,
      data: {
        per_pos_evakuasi: result,
        total_keseluruhan: totals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET evacuee statistics/summary
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { center_id } = req.query;
    const accessibleCenters = await getAccessibleCenters(req);

    if (accessibleCenters !== null && accessibleCenters.length === 0) {
      return res.json({
        success: true,
        data: { total: 0, by_category: [], by_gender: [], by_center: [], vulnerable_groups: [] }
      });
    }

    let whereClause = 'WHERE e.status = ?';
    const params = ['active'];

    if (accessibleCenters !== null) {
      whereClause += ' AND e.evacuation_center_id IN (' + accessibleCenters.map(() => '?').join(',') + ')';
      params.push(...accessibleCenters);
    }

    if (center_id) {
      whereClause += ' AND e.evacuation_center_id = ?';
      params.push(center_id);
    }

    const totalResult = await query('SELECT COUNT(*) as count FROM evacuees e ' + whereClause, params);
    const total = totalResult[0]?.count || 0;

    const byCategory = await query('SELECT e.category, COUNT(*) as count FROM evacuees e ' + whereClause + ' GROUP BY e.category ORDER BY count DESC', params);

    const byGender = await query('SELECT e.gender, COUNT(*) as count FROM evacuees e ' + whereClause + ' GROUP BY e.gender', params);

    let centerQuery = 'SELECT ec.id, ec.name, COUNT(e.id) as evacuee_count FROM evacuation_centers ec LEFT JOIN evacuees e ON ec.id = e.evacuation_center_id AND e.status = ?';
    const centerParams = ['active'];
    if (accessibleCenters !== null) {
      centerQuery += ' WHERE ec.id IN (' + accessibleCenters.map(() => '?').join(',') + ')';
      centerParams.push(...accessibleCenters);
    }
    centerQuery += ' GROUP BY ec.id ORDER BY evacuee_count DESC';
    const byCenter = await query(centerQuery, centerParams);

    const vulnerable = await query('SELECT e.category, COUNT(*) as count FROM evacuees e ' + whereClause + " AND e.category IN ('bayi', 'balita', 'lansia', 'ibu_hamil', 'disabilitas') GROUP BY e.category", params);

    res.json({
      success: true,
      data: { total, by_category: byCategory, by_gender: byGender, by_center: byCenter, vulnerable_groups: vulnerable }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET evacuee by ID (must be last to avoid conflict with other GET routes)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const evacuee = await queryOne('SELECT e.*, ec.name as center_name, ec.rw as center_rw FROM evacuees e LEFT JOIN evacuation_centers ec ON e.evacuation_center_id = ec.id WHERE e.id = ?', [req.params.id]);
    if (!evacuee) {
      return res.status(404).json({ success: false, error: 'Evacuee not found' });
    }

    const accessibleRWs = getAccessibleRWs(req.user);
    if (req.user.role === 'pic_rw' && evacuee.center_rw && !accessibleRWs.includes(evacuee.center_rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke data ini' });
    }

    res.json({ success: true, data: evacuee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create evacuee (PIC RW can create)
router.post('/', authenticate, async (req, res) => {
  try {
    const { evacuation_center_id, name, nik, age, gender, category, needs, health_condition, notes } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, error: 'Nama dan kategori wajib diisi' });
    }

    if (evacuation_center_id) {
      const center = await queryOne('SELECT rw FROM evacuation_centers WHERE id = ?', [evacuation_center_id]);
      if (center) {
        const accessibleRWs = getAccessibleRWs(req.user);
        if (req.user.role === 'pic_rw' && !accessibleRWs.includes(center.rw)) {
          return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke pos evakuasi ini' });
        }
      }
    }

    const result = await run(
      'INSERT INTO evacuees (evacuation_center_id, name, nik, age, gender, category, needs, health_condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [evacuation_center_id, name, nik, age, gender, category, needs, health_condition, notes]
    );
    const newEvacuee = await queryOne('SELECT * FROM evacuees WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newEvacuee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update evacuee (PIC RW can edit evacuees in their RW, Super Admin can edit all)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT e.*, ec.rw as center_rw FROM evacuees e LEFT JOIN evacuation_centers ec ON e.evacuation_center_id = ec.id WHERE e.id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Evacuee not found' });
    }

    // Check if user can edit this evacuee
    if (!canEditEvacuee(req.user, existing)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses untuk mengubah data ini' });
    }

    // Get new center's RW if changing center
    let newCenterRw = existing.center_rw;
    const { evacuation_center_id } = req.body;
    if (evacuation_center_id && evacuation_center_id !== existing.evacuation_center_id) {
      const newCenter = await queryOne('SELECT rw FROM evacuation_centers WHERE id = ?', [evacuation_center_id]);
      if (newCenter) {
        const accessibleRWs = getAccessibleRWs(req.user);
        if (req.user.role === 'pic_rw' && !accessibleRWs.includes(newCenter.rw)) {
          return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke pos evakuasi ini' });
        }
        newCenterRw = newCenter.rw;
      }
    }

    const { name, nik, age, gender, category, needs, health_condition, notes, status } = req.body;
    await run(
      'UPDATE evacuees SET name = ?, nik = ?, age = ?, gender = ?, category = ?, needs = ?, health_condition = ?, notes = ?, status = ?, evacuation_center_id = ? WHERE id = ?',
      [
        name || existing.name,
        nik ?? existing.nik,
        age ?? existing.age,
        gender || existing.gender,
        category || existing.category,
        needs || existing.needs,
        health_condition || existing.health_condition,
        notes || existing.notes,
        req.user.role === 'pic_rw' ? existing.status : (status || existing.status),
        evacuation_center_id ?? existing.evacuation_center_id,
        id
      ]
    );
    const updated = await queryOne('SELECT * FROM evacuees WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE evacuee (Super Admin only - PIC RW cannot delete)
router.delete('/:id', authenticate, async (req, res) => {
  if (!canDelete(req.user)) {
    return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa menghapus data' });
  }

  try {
    await run('DELETE FROM evacuees WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Data pengungsi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
