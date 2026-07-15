import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// GET frequency statistics (yearly)
router.get('/frequency', async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        strftime('%Y', created_at) as year,
        COUNT(*) as total_reports,
        SUM(CASE WHEN category = 'banjir' THEN 1 ELSE 0 END) as banjir_count,
        SUM(CASE WHEN category = 'genangan' THEN 1 ELSE 0 END) as genangan_count,
        SUM(CASE WHEN category = 'longsor' THEN 1 ELSE 0 END) as longsor_count,
        AVG(water_level) as avg_water_level,
        MAX(water_level) as max_water_level
      FROM reports
      GROUP BY strftime('%Y', created_at)
      ORDER BY year DESC
    `);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET monthly statistics for a year
router.get('/monthly/:year', async (req, res) => {
  try {
    const { year } = req.params;

    const stats = await query(`
      SELECT
        strftime('%m', created_at) as month,
        strftime('%Y', created_at) as year,
        COUNT(*) as total_reports,
        SUM(CASE WHEN category = 'banjir' THEN 1 ELSE 0 END) as banjir_count,
        SUM(CASE WHEN water_level > 80 THEN 1 ELSE 0 END) as danger_level_count,
        AVG(water_level) as avg_water_level
      FROM reports
      WHERE strftime('%Y', created_at) = ?
      GROUP BY strftime('%m', created_at), strftime('%Y', created_at)
      ORDER BY month ASC
    `, [year]);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET risk areas statistics
router.get('/risk-areas', async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        rw,
        COUNT(*) as total_reports,
        SUM(CASE WHEN category = 'banjir' THEN 1 ELSE 0 END) as banjir_count,
        AVG(water_level) as avg_water_level,
        MAX(water_level) as max_water_level,
        SUM(CASE WHEN water_level > 80 THEN 1 ELSE 0 END) as danger_events
      FROM reports
      GROUP BY rw
      ORDER BY danger_events DESC, avg_water_level DESC
    `);

    // Classify risk levels
    const riskClassification = stats.map(s => {
      let risk_level = 'low';
      if (s.danger_events >= 5 || s.avg_water_level > 60) {
        risk_level = 'high';
      } else if (s.danger_events >= 2 || s.avg_water_level > 40) {
        risk_level = 'medium';
      }
      return { ...s, risk_level };
    });

    res.json({ success: true, data: riskClassification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const totalReportsResult = await query('SELECT COUNT(*) as count FROM reports');
    const totalReports = totalReportsResult[0]?.count || 0;

    const totalPointsResult = await query('SELECT COUNT(*) as count FROM monitoring_points');
    const totalPoints = totalPointsResult[0]?.count || 0;

    const activeSensorsResult = await query("SELECT COUNT(*) as count FROM monitoring_points WHERE type = 'sensor' AND status = 'active'");
    const activeSensors = activeSensorsResult[0]?.count || 0;

    // SQLite compatible date comparison
    const recentReportsResult = await query("SELECT COUNT(*) as count FROM reports WHERE created_at >= datetime('now', '-24 hours')");
    const recentReports = recentReportsResult[0]?.count || 0;

    // Get latest sensor readings
    const latestLevels = await query(`
      SELECT mp.id, mp.rw, mp.name, sr.water_level, sr.recorded_at
      FROM monitoring_points mp
      INNER JOIN sensor_readings sr ON mp.id = sr.monitoring_point_id
      INNER JOIN (
        SELECT monitoring_point_id, MAX(recorded_at) as max_date
        FROM sensor_readings
        GROUP BY monitoring_point_id
      ) latest ON sr.monitoring_point_id = latest.monitoring_point_id AND sr.recorded_at = latest.max_date
      WHERE mp.type = 'sensor'
    `);

    const avgWaterLevel = latestLevels.length > 0
      ? latestLevels.reduce((sum, l) => sum + parseFloat(l.water_level), 0) / latestLevels.length
      : 0;

    const maxWaterLevel = latestLevels.length > 0
      ? Math.max(...latestLevels.map(l => parseFloat(l.water_level)))
      : 0;

    res.json({
      success: true,
      data: {
        total_reports: totalReports,
        total_monitoring_points: totalPoints,
        active_sensors: activeSensors,
        recent_reports: recentReports,
        avg_water_level: Math.round(avgWaterLevel * 10) / 10,
        max_water_level: Math.round(maxWaterLevel * 10) / 10,
        sensor_readings: latestLevels
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET category distribution
router.get('/categories', async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        category,
        COUNT(*) as count,
        AVG(water_level) as avg_water_level
      FROM reports
      GROUP BY category
    `);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
