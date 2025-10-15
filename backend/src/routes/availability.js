import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { nhGetAvailability } from '../services/nexhealth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { provider_id, date, type_id } = req.query;
    if (!provider_id || !date) return res.status(400).json({ error: 'provider_id and date required' });

    let slots = [];
    try {
      const nhSlots = await nhGetAvailability({ provider_id, date, appointment_type_id: type_id });
      slots = (nhSlots || []).map(s => ({ start_time: s.start_time, end_time: s.end_time, available: s.available !== false }));
    } catch {
      slots = [];
    }

    res.json({ date, slots });
  } catch (e) { next(e); }
});

export default router;
