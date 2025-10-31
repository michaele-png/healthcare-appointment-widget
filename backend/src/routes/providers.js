import { Router } from 'express';
import { nh, SUBDOMAIN } from '../lib/nexhealth.js';

const router = Router();

router.get('/__ping', (req, res) => res.json({ ok: true, source: 'providers' }));

router.get('/locations', async (_req, res) => {
  try {
    const { data } = await nh.get('/locations', { params: { subdomain: SUBDOMAIN } });
    res.json(data);
  } catch (e) {
    const status = e?.response?.status || 500;
    const body = e?.response?.data || { error: e.message };
    console.error('NH /locations error:', status, body);
    res.status(status).json(body);
  }
});

router.get('/', async (req, res) => {
  try {
    const { locationId } = req.query;
    const { data } = await nh.get('/providers', {
      params: { subdomain: SUBDOMAIN, location_id: locationId }
    });
    res.json(data);
  } catch (e) {
    const status = e?.response?.status || 500;
    const body = e?.response?.data || { error: e.message };
    console.error('NH /providers error:', status, body);
    res.status(status).json(body);
  }
});

router.get('/visit-types', async (req, res) => {
  try {
    const providerId = req.query.providerId || req.query.provider_id;
    const locationId = req.query.locationId || req.query.location_id;
    if (!providerId || !locationId) {
      return res.status(400).json({ code: false, error: ['Missing providerId or locationId'] });
    }

    const { data } = await nh.get('/appointment_types', {
      params: {
        subdomain: SUBDOMAIN,
        provider_id: providerId,
        location_id: locationId,    // <-- required by NexHealth
      }
    });
    res.json(data);
  } catch (e) {
    const status = e?.response?.status || 500;
    const body = e?.response?.data || { error: e.message };
    console.error('NH /visit-types error:', status, body);
    res.status(status).json(body);
  }
});

export default router;
