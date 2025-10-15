import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { createAppointmentSchema } from '../utils/joiSchemas.js';
import { nhCreateAppointment, nhCancelAppointment } from '../services/nexhealth.js';
import { auditLog } from '../services/audit.js';
import { addMinutes } from '../utils/time.js';

const router = express.Router();

router.post('/', authenticate, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { error, value } = createAppointmentSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { provider_id, appointment_type_id, start_time, patient, reason, insurance_info } = value;

    await conn.beginTransaction();

    let duration = 30;
    try {
      const [[type]] = await conn.query('SELECT duration_minutes FROM appointment_types WHERE id = ? AND active = 1', [appointment_type_id]);
      if (type) duration = type.duration_minutes;
    } catch {}
    const end_time = addMinutes(start_time, duration);

    const [existing] = await conn.query('SELECT id, nexhealth_patient_id FROM patients WHERE email = ? LIMIT 1', [patient.email]);
    let patient_id;
    if (existing.length) {
      patient_id = existing[0].id;
      await conn.query('UPDATE patients SET first_name=?, last_name=?, phone=?, date_of_birth=?, address=?, insurance_info=? WHERE id=?', [
        patient.first_name, patient.last_name, patient.phone, patient.date_of_birth,
        JSON.stringify(patient.address || null), JSON.stringify(insurance_info || null), patient_id
      ]);
    } else {
      await conn.query(
        'INSERT INTO patients (id, first_name, last_name, date_of_birth, email, phone, address, insurance_info) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)',
        [patient.first_name, patient.last_name, patient.date_of_birth, patient.email, patient.phone, JSON.stringify(patient.address || null), JSON.stringify(insurance_info || null)]
      );
      const [[row]] = await conn.query('SELECT id FROM patients WHERE email = ? LIMIT 1', [patient.email]);
      patient_id = row.id;
    }

    const appointment_id = (await conn.query('SELECT UUID() AS id'))[0][0].id;
    await conn.query(
      'INSERT INTO appointments (id, provider_id, patient_id, appointment_type_id, start_time, end_time, status, reason, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [appointment_id, provider_id, patient_id, appointment_type_id, start_time, end_time, 'scheduled', reason || null, JSON.stringify({ source: 'widget' })]
    );

    await conn.commit();
    conn.release();

    try {
      const nh = await nhCreateAppointment({
        provider_id,
        patient_id: existing[0]?.nexhealth_patient_id || undefined,
        appointment_type_id,
        start_time,
        duration_minutes: duration,
        notes: reason || undefined
      });
      if (nh?.id) await db.query('UPDATE appointments SET nexhealth_appointment_id = ? WHERE id = ?', [nh.id, appointment_id]);
    } catch {}

    const io = req.app.get('io');
    io.emit('appointment-created', { appointment_id, provider_id, start_time });

    await auditLog({ userId: req.user?.userId, action: 'appointment.created', entityType: 'appointment', entityId: appointment_id, oldData: null, newData: { provider_id, start_time }, ip: req.ip, ua: req.headers['user-agent'] });

    res.status(201).json({ appointment_id, confirmation_number: `APT-${appointment_id}`, status: 'scheduled', start_time });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    try { conn.release(); } catch {}
    next(e);
  }
});

router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[appt]] = await db.query('SELECT id, nexhealth_appointment_id FROM appointments WHERE id = ?', [id]);
    if (!appt) return res.status(404).json({ error: 'Not found' });

    await db.query('UPDATE appointments SET status = "cancelled" WHERE id = ?', [id]);
    if (appt.nexhealth_appointment_id) {
      try { await nhCancelAppointment(appt.nexhealth_appointment_id); } catch {}
    }

    const io = req.app.get('io');
    io.emit('appointment-cancelled', { appointment_id: id });

    res.json({ appointment_id: id, status: 'cancelled' });
  } catch (e) { next(e); }
});

export default router;
