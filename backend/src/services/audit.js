import db from '../config/database.js';

export async function auditLog({ userId, action, entityType, entityId, oldData, newData, ip, ua }) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, action, entityType, entityId || null, JSON.stringify(oldData || null), JSON.stringify(newData || null), ip || null, ua || null]
    );
  } catch {}
}
