import { Router } from 'express';
import { nh, SUBDOMAIN } from '../lib/nexhealth.js';

const router = Router();

/**
 * GET /api/providers?locationId=LOC_ID
 * Returns providers directly from NexHealth (source of truth)
 */
router.get('/', async (req, res) => {
  try {
    const { locationId } = req.query;
    const { data } = await nh.get('/providers', {
      params: { subdomain: SUBDOMAIN, location_id: locationId }
    });

    // Normalize to widget shape
    const providers = (data || []).map(p => ({
      id: p.id, // NexHealth provider id
      name: p.name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
      specialty: p.specialty || null,
      photo_url: p.photo_url || null,
      accepting_new_patients: p.accepting_new_patients ?? true,
      next_available: p.next_available || null,
      address_line: p.address_line || p.location?.address_line || null,
      location_id: p.location_id || p.location?.id || null,
    }));

    res.json({ providers });
  } catch (e) {
    res.status(e?.response?.status || 500).json(e?.response?.data || { error: 'providers failed' });
  }
});

/**
 * GET /api/providers/locations
 * Directory helper for widget filter
 */
router.get('/locations', async (_req, res) => {
  try {
    const { data } = await nh.get('/locations', { params: { subdomain: SUBDOMAIN } });
    res.json(data);
  } catch (e) {
    const status = e?.response?.status || 500;
    const body   = e?.response?.data || { error: e.message };
    console.error('NH /locations error:', status, body);
    res.status(status).json(body); // <-- show what NH actually sent
  }
});
/**
 * GET /api/providers/visit-types?providerId=PROV_ID
 * List visit types; providerId optional
 */
router.get('/visit-types', async (req, res) => {
  try {
    const { providerId } = req.query;
    const { data } = await nh.get('/appointment_types', {
      params: { subdomain: SUBDOMAIN, provider_id: providerId }
    });
    res.json(data);
  } catch (e) {
    res.status(e?.response?.status || 500).json(e?.response?.data || { error: 'visit types failed' });
  }
});

export default router;
