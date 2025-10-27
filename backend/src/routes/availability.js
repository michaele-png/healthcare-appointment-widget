import { Router } from 'express';
import { nh, SUBDOMAIN } from '../lib/nexhealth.js';

const router = Router();

/**
 * GET /api/availability/:providerId/slots?date=YYYY-MM-DD&locationId=LOC_ID&typeId=VT_ID
 */
router.get('/:providerId/slots', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date, locationId, typeId } = req.query;
    if (!providerId || !date || !locationId || !typeId) {
      return res.status(400).json({ error: 'providerId, date, locationId, typeId required' });
    }

    const { data } = await nh.get('/appointment_slots', {
      params: {
        subdomain: SUBDOMAIN,
        provider_id: providerId,
        location_id: locationId,
        // include both keys for compatibility, NH may accept one:
        visit_type_id: typeId,
        appointment_type_id: typeId,
        date,
      },
    });

    res.json(data);
  } catch (e) {
    res.status(e?.response?.status || 500)
       .json(e?.response?.data || { error: 'Failed to fetch slots' });
  }
});

export default router;
