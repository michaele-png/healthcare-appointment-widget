import express from 'express';
import crypto from 'crypto';
import db from '../config/database.js';

const router = express.Router();

function verifySignature(rawBody, sig, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === sig;
}

router.post('/nexhealth', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.get('X-NexHealth-Signature');
  const secret = process.env.NEXHEALTH_WEBHOOK_SECRET;
  const raw = req.body.toString('utf8');

  if (!verifySignature(raw, signature || '', secret || '')) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(raw);
  try {
    if (event.event === 'appointment.updated') {
      const a = event.data;
      await db.query('UPDATE appointments SET status = ?, updated_at = NOW() WHERE nexhealth_appointment_id = ?', [a.status || 'confirmed', a.appointment_id]);
    }
    if (event.event === 'appointment.cancelled') {
      const a = event.data;
      await db.query('UPDATE appointments SET status = "cancelled", updated_at = NOW() WHERE nexhealth_appointment_id = ?', [a.appointment_id]);
    }
  } catch (e) { console.error('Webhook error', e); }

  res.json({ received: true, processed_at: new Date().toISOString() });
});

export default router;
