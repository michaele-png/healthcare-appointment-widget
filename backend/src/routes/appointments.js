import { Router } from 'express';
import { nh, SUBDOMAIN } from '../lib/nexhealth.js';

const router = Router();

/**
 * POST /api/appointments
 * Body (example):
 * {
 *   "provider_id": "prov_123",
 *   "location_id": "loc_001",
 *   "visit_type_id": "vt_10",
 *   "start_time": "2025-10-25T09:00:00-04:00",
 *   "patient": {
 *     "first_name":"Alex","last_name":"Patient","email":"a@b.com","phone":"+1-555-0100","dob":"1995-05-20"
 *   },
 *   "notes": "Web widget"
 * }
 */
router.post('/', /* remove authenticate for public widget */ async (req, res) => {
  try {
    // lightweight guard (keep it simple for MVP)
    const { provider_id, location_id, visit_type_id, start_time, patient } = req.body || {};
    if (!provider_id || !location_id || !visit_type_id || !start_time || !patient?.first_name || !patient?.last_name)
      return res.status(400).json({ error: 'Missing required fields' });

    // Prevent double-booking on retries
    const idem = `${patient.email || patient.phone || 'anon'}-${start_time}`;

    const payload = {
      subdomain: SUBDOMAIN,
      provider_id,
      location_id,
      appointment_type_id: visit_type_id, // some NH accounts name this appointment_type_id
      visit_type_id,                       // include both to be safe if your API expects visit_type_id
      start_time,
      // optional: duration_minutes if your flow uses custom duration
      patient: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        dob: patient.dob || patient.date_of_birth || undefined
      },
      notes: req.body.notes || undefined,
      metadata: { source: 'vemipo-widget' }
    };

    const { data } = await nh.post('/appointments', payload, {
      headers: { 'Idempotency-Key': idem }
    });

    // return the NexHealth appointment as-is (ids are NH ids)
    res.status(201).json(data);
  } catch (e) {
    const status = e?.response?.status || 500;
    const err = e?.response?.data || { error: 'create appointment failed' };
    res.status(status).json(err);
  }
});

/**
 * (Optional) GET /api/appointments?start=&end=&locationId=
 * Use for an internal calendar view or verification
 */
router.get('/', async (req, res) => {
  try {
    const { start, end, locationId } = req.query;
    if (!start || !end || !locationId)
      return res.status(400).json({ error: 'start, end, and locationId are required' });

    const { data } = await nh.get('/appointments', {
      params: { subdomain: SUBDOMAIN, location_id: locationId, start, end }
    });
    res.json(data);
  } catch (e) {
    res.status(e?.response?.status || 500).json(e?.response?.data || { error: 'list appointments failed' });
  }
});

/**
 * (Optional) POST /api/appointments/:id/cancel
 * Here :id is the **NexHealth appointment id** (e.g. appt_abc123)
 * Keep this protected if it’s staff-only.
 */
router.post('/:id/cancel', /* authenticate, */ async (req, res) => {
  try {
    const { id } = req.params;

    // Depending on NH API: some use DELETE, others a PATCH 'status: canceled'
    // Try DELETE first; if your account expects a different verb, swap accordingly.
    await nh.delete(`/appointments/${id}`, {
      params: { subdomain: SUBDOMAIN }
    });

    res.json({ appointment_id: id, status: 'canceled' });
  } catch (e) {
    res.status(e?.response?.status || 500).json(e?.response?.data || { error: 'cancel failed' });
  }
});

export default router;
