import express from 'express';
import { query, queryOne, run } from '../db/database.js';
import { authenticate, getAccessibleRWs } from '../middleware/auth.js';

const router = express.Router();

function canDelete(user) {
  return user?.role === 'super_admin';
}

function canCreateEdit(user) {
  return true; // Both Super Admin and PIC RW can create/edit
}

function canAccessRW(user, rw) {
  if (user?.role === 'super_admin') return true;
  const accessibleRWs = getAccessibleRWs(user);
  return accessibleRWs.includes(rw);
}

// GET all population data
router.get('/', authenticate, async (req, res) => {
  try {
    const { rw, year } = req.query;
    const accessibleRWs = getAccessibleRWs(req.user);

    let sql = 'SELECT * FROM population_data WHERE 1=1';
    const params = [];

    // PIC RW can only see their RW data - ALWAYS filter, no exceptions
    if (req.user.role === 'pic_rw') {
      // If no accessible RWs, return empty
      if (!accessibleRWs || accessibleRWs.length === 0) {
        return res.json({ success: true, data: [] });
      }
      sql += ' AND rw IN (' + accessibleRWs.map(() => '?').join(',') + ')';
      params.push(...accessibleRWs);
    }

    if (rw) {
      sql += ' AND rw = ?';
      params.push(rw);
    }
    if (year) {
      sql += ' AND year = ?';
      params.push(year);
    }
    sql += ' ORDER BY rw, year DESC';

    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET population summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const accessibleRWs = getAccessibleRWs(req.user);

    // Get latest year data
    let yearSql = 'SELECT MAX(year) as year FROM population_data';
    const yearParams = [];

    if (req.user.role === 'pic_rw') {
      yearSql += ' WHERE rw IN (' + accessibleRWs.map(() => '?').join(',') + ')';
      yearParams.push(...accessibleRWs);
    }

    const latestYearResult = await query(yearSql, yearParams);
    const latestYear = latestYearResult[0]?.year || 2026;

    // Get summary
    let summarySql = 'SELECT SUM(total_population) as total_population, SUM(total_kk) as total_kk, SUM(bayi) as total_bayi, SUM(balita) as total_balita, SUM(anak) as total_anak, SUM(remaja) as total_remaja, SUM(dewasa) as total_dewasa, SUM(lansia) as total_lansia, SUM(ibu_hamil) as total_ibu_hamil, SUM(disabilitas) as total_disabilitas, SUM(laki_laki) as total_laki_laki, SUM(perempuan) as total_perempuan FROM population_data WHERE year = ?';
    const summaryParams = [latestYear];

    if (req.user.role === 'pic_rw') {
      summarySql += ' AND rw IN (' + accessibleRWs.map(() => '?').join(',') + ')';
      summaryParams.push(...accessibleRWs);
    }

    const summaryResult = await query(summarySql, summaryParams);
    const summary = summaryResult[0] || {};

    // Get by RW
    let byRwSql = 'SELECT * FROM population_data WHERE year = ?';
    const byRwParams = [latestYear];

    if (req.user.role === 'pic_rw') {
      byRwSql += ' AND rw IN (' + accessibleRWs.map(() => '?').join(',') + ')';
      byRwParams.push(...accessibleRWs);
    }
    byRwSql += ' ORDER BY rw';

    const byRw = await query(byRwSql, byRwParams);

    res.json({
      success: true,
      data: { year: latestYear, summary, by_rw: byRw }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single population data
router.get('/:id', authenticate, async (req, res) => {
  try {
    const data = await queryOne('SELECT * FROM population_data WHERE id = ?', [req.params.id]);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Population data not found' });
    }

    const accessibleRWs = getAccessibleRWs(req.user);
    if (req.user.role === 'pic_rw' && !accessibleRWs.includes(data.rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke data ini' });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create/update population data (PIC RW can create for their RW, Super Admin can create for all)
router.post('/', authenticate, async (req, res) => {
  try {
    const { rw, total_population, total_kk, laki_laki, perempuan, bayi, balita, anak, remaja, dewasa, lansia, ibu_hamil, disabilitas, year } = req.body;

    if (!rw) {
      return res.status(400).json({ success: false, error: 'RW wajib diisi' });
    }

    // Check if user can access this RW
    if (!canAccessRW(req.user, rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke RW ini' });
    }

    const existing = await queryOne('SELECT * FROM population_data WHERE rw = ? AND year = ?', [rw, year || 2026]);

    if (existing) {
      await run(
        'UPDATE population_data SET total_population = ?, total_kk = ?, laki_laki = ?, perempuan = ?, bayi = ?, balita = ?, anak = ?, remaja = ?, dewasa = ?, lansia = ?, ibu_hamil = ?, disabilitas = ?, updated_at = NOW() WHERE id = ?',
        [
          total_population ?? existing.total_population,
          total_kk ?? existing.total_kk,
          laki_laki ?? existing.laki_laki,
          perempuan ?? existing.perempuan,
          bayi ?? existing.bayi,
          balita ?? existing.balita,
          anak ?? existing.anak,
          remaja ?? existing.remaja,
          dewasa ?? existing.dewasa,
          lansia ?? existing.lansia,
          ibu_hamil ?? existing.ibu_hamil,
          disabilitas ?? existing.disabilitas,
          existing.id
        ]
      );
      const updated = await queryOne('SELECT * FROM population_data WHERE id = ?', [existing.id]);
      res.json({ success: true, data: updated, updated: true });
    } else {
      const result = await run(
        'INSERT INTO population_data (rw, total_population, total_kk, laki_laki, perempuan, bayi, balita, anak, remaja, dewasa, lansia, ibu_hamil, disabilitas, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [rw, total_population || 0, total_kk || 0, laki_laki || 0, perempuan || 0, bayi || 0, balita || 0, anak || 0, remaja || 0, dewasa || 0, lansia || 0, ibu_hamil || 0, disabilitas || 0, year || 2026]
      );
      const newData = await queryOne('SELECT * FROM population_data WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({ success: true, data: newData, created: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update population data (PIC RW can edit their RW, Super Admin can edit all)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT * FROM population_data WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Population data not found' });
    }

    // Check if user can access this RW
    if (!canAccessRW(req.user, existing.rw)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses untuk mengubah data ini' });
    }

    const { rw, total_population, total_kk, laki_laki, perempuan, bayi, balita, anak, remaja, dewasa, lansia, ibu_hamil, disabilitas, year } = req.body;

    await run(
      'UPDATE population_data SET rw = ?, total_population = ?, total_kk = ?, laki_laki = ?, perempuan = ?, bayi = ?, balita = ?, anak = ?, remaja = ?, dewasa = ?, lansia = ?, ibu_hamil = ?, disabilitas = ?, year = ?, updated_at = NOW() WHERE id = ?',
      [
        rw || existing.rw,
        total_population ?? existing.total_population,
        total_kk ?? existing.total_kk,
        laki_laki ?? existing.laki_laki,
        perempuan ?? existing.perempuan,
        bayi ?? existing.bayi,
        balita ?? existing.balita,
        anak ?? existing.anak,
        remaja ?? existing.remaja,
        dewasa ?? existing.dewasa,
        lansia ?? existing.lansia,
        ibu_hamil ?? existing.ibu_hamil,
        disabilitas ?? existing.disabilitas,
        year || existing.year,
        id
      ]
    );

    const updated = await queryOne('SELECT * FROM population_data WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE population data (Super Admin only - PIC RW cannot delete)
router.delete('/:id', authenticate, async (req, res) => {
  if (!canDelete(req.user)) {
    return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa menghapus data' });
  }

  try {
    await run('DELETE FROM population_data WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Population data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /population/seed - Seed sample population data (Super Admin only)
router.post('/seed', authenticate, async (req, res) => {
  if (!canDelete(req.user)) {
    return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa generate data' });
  }

  try {
    // Check if data already exists
    const existing = await query('SELECT COUNT(*) as count FROM population_data');
    if (existing[0]?.count > 0) {
      // Clear existing data
      await run('DELETE FROM population_data', []);
    }

    // Generate sample data for all 13 RWs
    const rws = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'];
    const year = 2026;

    for (const rw of rws) {
      const totalPop = Math.floor(Math.random() * 5000) + 2000;
      const totalKK = Math.floor(totalPop / 3.5);
      const lakiLaki = Math.floor(totalPop * 0.48);
      const perempuan = totalPop - lakiLaki;
      const bayi = Math.floor(totalPop * 0.03);
      const balita = Math.floor(totalPop * 0.05);
      const anak = Math.floor(totalPop * 0.12);
      const remaja = Math.floor(totalPop * 0.15);
      const dewasa = Math.floor(totalPop * 0.50);
      const lansia = Math.floor(totalPop * 0.15);
      const ibuHamil = Math.floor(totalKK * 0.02);
      const disabilitas = Math.floor(totalPop * 0.03);

      await run(
        `INSERT INTO population_data (rw, total_population, total_kk, laki_laki, perempuan, bayi, balita, anak, remaja, dewasa, lansia, ibu_hamil, disabilitas, year)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rw, totalPop, totalKK, lakiLaki, perempuan, bayi, balita, anak, remaja, dewasa, lansia, ibuHamil, disabilitas, year]
      );
    }

    res.json({ success: true, message: 'Sample population data generated for all RWs' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
