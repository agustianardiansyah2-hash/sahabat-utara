import express from 'express';
import { query, queryOne, run } from '../db/database.js';

const router = express.Router();

// GET sensor readings for a monitoring point
router.get('/:pointId', async (req, res) => {
  try {
    const { pointId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    let queryStr = 'SELECT * FROM sensor_readings WHERE monitoring_point_id = ?';
    const params = [pointId];

    if (startDate) {
      queryStr += ' AND recorded_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      queryStr += ' AND recorded_at <= ?';
      params.push(endDate);
    }

    queryStr += ' ORDER BY recorded_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const readings = await query(queryStr, params);
    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create sensor reading
router.post('/', async (req, res) => {
  try {
    const { monitoring_point_id, water_level } = req.body;

    if (!monitoring_point_id || water_level === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await run(
      'INSERT INTO sensor_readings (monitoring_point_id, water_level) VALUES (?, ?)',
      [monitoring_point_id, parseFloat(water_level)]
    );

    const newReading = await queryOne('SELECT * FROM sensor_readings WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET latest reading for all sensors
router.get('/', async (req, res) => {
  try {
    const readings = await query(`
      SELECT sr.*, mp.rw, mp.name as point_name, mp.type
      FROM sensor_readings sr
      INNER JOIN monitoring_points mp ON sr.monitoring_point_id = mp.id
      INNER JOIN (
        SELECT monitoring_point_id, MAX(recorded_at) as max_date
        FROM sensor_readings
        GROUP BY monitoring_point_id
      ) latest ON sr.monitoring_point_id = latest.monitoring_point_id AND sr.recorded_at = latest.max_date
    `);

    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
