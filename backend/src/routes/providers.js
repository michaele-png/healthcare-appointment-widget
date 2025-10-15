import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { nhGetProviders } from '../services/nexhealth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { practice_id, specialty } = req.query;
    const params = [];
    let sql = 'SELECT p.id, CONCAT(p.first_name, " ", p.last_name) as name, p.specialty, p.bio, p.photo_url, p.accepting_new_patients FROM providers p WHERE p.active = 1';
    if (practice_id) { sql += ' AND p.practice_id = ?'; params.push(practice_id); }
    if (specialty) { sql += ' AND p.specialty = ?'; params.push(specialty); }
    const [rows] = await db.query(sql, params);

    let nextAvailByProvider = {};
    try {
      const nhProviders = await nhGetProviders();
      nextAvailByProvider = (nhProviders || []).reduce((acc, item) => {
        acc[item.id] = item.next_available || null;
        return acc;
      }, {});
    } catch {}

    const providers = rows.map(r => ({
      id: r.id,
      name: r.name,
      specialty: r.specialty,
      bio: r.bio,
      photo_url: r.photo_url,
      accepting_new_patients: !!r.accepting_new_patients,
      next_available: nextAvailByProvider[r.id] || null
    }));

    res.json({ providers });
  } catch (e) { next(e); }
});

export default router;
