import { Router } from 'express';
import { nh, SUBDOMAIN, NH_ENABLED } from '../lib/nexhealth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const providerId = req.query.providerId || req.query.provider_id;
    const locationId = req.query.locationId || req.query.location_id;
    const from = req.query.from; // YYYY-MM-DD
    const to = req.query.to;     // YYYY-MM-DD

    if (!providerId || !locationId || !from || !to) {
      return res.status(400).json({
        code: false,
        error: ['Missing providerId, locationId, from, or to'],
      });
    }

    if (String(NH_ENABLED).toLowerCase() === 'false') {
      const today = new Date(from);
      const out = [];
      for (let i = 0; i < 7; i++) {
        const d1 = new Date(today); d1.setDate(d1.getDate() + i); d1.setHours(10, 0, 0, 0);
        const d2 = new Date(today); d2.setDate(d2.getDate() + i); d2.setHours(14, 0, 0, 0);
        out.push({ start: d1.toISOString() }, { start: d2.toISOString() });
      }
      return res.json(out);
    }

    let data;
    try {
      const r = await nh.get('/available_times', {
        params: {
          subdomain: SUBDOMAIN,
          provider_id: providerId,
          location_id: locationId,
          start_date: from,
          end_date: to,
        },
      });
      data = r.data;
    } catch (e1) {
      const status = e1?.response?.status;
      if (status !== 404) throw e1; // rethrow anything except 404
      const r2 = await nh.get('/availability', {
        params: {
          subdomain: SUBDOMAIN,
          provider_id: providerId,
          location_id: locationId,
          start_date: from,
          end_date: to,
        },
      });
      data = r2.data;
    }

    // Normalize to [{ start, end? }, ...]
    const rows =
      Array.isArray(data?.data) ? data.data :
      Array.isArray(data?.available_times) ? data.available_times :
      Array.isArray(data) ? data : [];

    const slots = rows.map((s) => ({
      start: s.start ?? s.start_time ?? s.slotStart ?? s.begin ?? s.time,
      end:   s.end   ?? s.end_time   ?? s.slotEnd   ?? undefined,
    })).filter(s => !!s.start);

    return res.json(slots);
  } catch (e) {
    const status = e?.response?.status || 500;
    const body = e?.response?.data || { error: e.message };
    console.error('NH /availability error:', status, body);
    res.status(status).json(body);
  }
});

export default router;
