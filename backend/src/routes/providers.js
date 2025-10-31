import { Router } from 'express';
import { nh, SUBDOMAIN } from '../lib/nexhealth.js';

const router = Router();

router.get('/__ping', (req, res) => res.json({ ok: true, source: 'providers' }));

// Get all locations
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

// Get providers (optional: by location)
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

// Get visit types (by provider)
router.get('/visit-types', async (req, res) => {
  try {
    const { providerId } = req.query;
    const { data } = await nh.get('/appointment_types', {
      params: { subdomain: SUBDOMAIN, provider_id: providerId }
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
