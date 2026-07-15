import express from 'express';
import { query, queryOne, run } from '../db/database.js';

const router = express.Router();

// GET all monitoring points
router.get('/', async (req, res) => {
  try {
    const points = await query(`
      SELECT mp.*,
        (SELECT water_level FROM sensor_readings WHERE monitoring_point_id = mp.id ORDER BY recorded_at DESC LIMIT 1) as latest_water_level,
        (SELECT recorded_at FROM sensor_readings WHERE monitoring_point_id = mp.id ORDER BY recorded_at DESC LIMIT 1) as last_reading_at
      FROM monitoring_points mp
      ORDER BY mp.rw, mp.type
    `);
    res.json({ success: true, data: points });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET monitoring points by RW
router.get('/rw/:rw', async (req, res) => {
  try {
    const points = await query('SELECT * FROM monitoring_points WHERE rw = ?', [req.params.rw]);
    res.json({ success: true, data: points });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single monitoring point
router.get('/:id', async (req, res) => {
  try {
    const point = await queryOne('SELECT * FROM monitoring_points WHERE id = ?', [req.params.id]);
    if (!point) {
      return res.status(404).json({ success: false, error: 'Monitoring point not found' });
    }
    res.json({ success: true, data: point });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create monitoring point
router.post('/', async (req, res) => {
  try {
    const { name, rw, latitude, longitude, type, status } = req.body;

    if (!name || !rw || !latitude || !longitude || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await run(
      'INSERT INTO monitoring_points (name, rw, latitude, longitude, type, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, rw, latitude, longitude, type, status || 'active']
    );

    const newPoint = await queryOne('SELECT * FROM monitoring_points WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newPoint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update monitoring point
router.put('/:id', async (req, res) => {
  try {
    const { name, rw, latitude, longitude, type, status } = req.body;
    const { id } = req.params;

    const existing = await queryOne('SELECT * FROM monitoring_points WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Monitoring point not found' });
    }

    await run(
      `UPDATE monitoring_points
       SET name = ?, rw = ?, latitude = ?, longitude = ?, type = ?, status = ?
       WHERE id = ?`,
      [
        name || existing.name,
        rw || existing.rw,
        latitude || existing.latitude,
        longitude || existing.longitude,
        type || existing.type,
        status || existing.status,
        id
      ]
    );

    const updated = await queryOne('SELECT * FROM monitoring_points WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE monitoring point
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM monitoring_points WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Monitoring point deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
