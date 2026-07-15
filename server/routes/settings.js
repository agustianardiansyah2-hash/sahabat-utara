import express from 'express';
import { queryOne, run } from '../db/database.js';

const router = express.Router();

// GET settings
router.get('/', async (req, res) => {
  try {
    const settings = await queryOne('SELECT * FROM settings WHERE id = 1');
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update settings
router.put('/', async (req, res) => {
  try {
    const { cctv_url_1, cctv_url_2, cctv_url_3, cctv_url_4, threshold_red, threshold_yellow } = req.body;

    const existing = await queryOne('SELECT * FROM settings WHERE id = 1');
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }

    await run(
      `UPDATE settings
       SET cctv_url_1 = ?, cctv_url_2 = ?, cctv_url_3 = ?, cctv_url_4 = ?,
           threshold_red = ?, threshold_yellow = ?, updated_at = NOW()
       WHERE id = 1`,
      [
        cctv_url_1 !== undefined ? cctv_url_1 : existing.cctv_url_1,
        cctv_url_2 !== undefined ? cctv_url_2 : existing.cctv_url_2,
        cctv_url_3 !== undefined ? cctv_url_3 : existing.cctv_url_3,
        cctv_url_4 !== undefined ? cctv_url_4 : existing.cctv_url_4,
        threshold_red !== undefined ? threshold_red : existing.threshold_red,
        threshold_yellow !== undefined ? threshold_yellow : existing.threshold_yellow
      ]
    );

    const updated = await queryOne('SELECT * FROM settings WHERE id = 1');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
