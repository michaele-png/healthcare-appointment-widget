import { Router } from "express";
import { nh, SUBDOMAIN } from "../lib/nexhealth.js";

const router = Router();

/**

 * Example body:
 * {
 *   "providerId": "prov_123",
 *   "locationId": "loc_001",
 *   "visitTypeId": "vt_10",
 *   "slotStart": "2025-11-02T14:00:00Z",
 *   "firstName": "Alex",
 *   "lastName": "Patient",
 *   "email": "a@b.com",
 *   "phone": "+1-555-0100"
 * }
 */
router.post("/", async (req, res) => {
  try {
    const b = req.body || {};

    // Accept both camelCase and snake_case
    const provider_id = b.provider_id ?? b.providerId;
    const location_id = b.location_id ?? b.locationId;
    const visit_type_id = b.visit_type_id ?? b.visitTypeId;
    const start_time = b.start_time ?? b.slot_start ?? b.slotStart;

    const patient =
      b.patient || {
        first_name: b.first_name ?? b.firstName,
        last_name: b.last_name ?? b.lastName,
        email: b.email,
        phone: b.phone,
        dob: b.dob ?? b.date_of_birth,
      };

    if (
      !provider_id ||
      !location_id ||
      !visit_type_id ||
      !start_time ||
      !patient?.first_name ||
      !patient?.last_name
    ) {
      return res
        .status(400)
        .json({ code: false, error: ["Missing required fields"] });
    }

    // Prevent double-booking on retries
    const idem = `${patient.email || patient.phone || "anon"}-${start_time}`;

    const payload = {
      subdomain: SUBDOMAIN,
      provider_id,
      location_id,
      appointment_type_id: visit_type_id, // support both keys
      visit_type_id,
      start_time,
      patient: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        dob: patient.dob || undefined,
      },
      notes: b.notes || undefined,
      metadata: { source: "vemipo-widget" },
    };

    // Send to NexHealth API
    const { data } = await nh.post("/appointments", payload, {
      headers: { "Idempotency-Key": idem },
    });

    res.status(201).json({ code: true, data });
  } catch (e) {
    const status = e?.response?.status || 500;
    const err = e?.response?.data || { error: "create appointment failed" };
    console.error("NH /appointments error:", status, err);
    res.status(status).json(err);
  }
});

/**
 * (Optional) GET /api/appointments?start=&end=&locationId=
 * Internal calendar view
 */
router.get("/", async (req, res) => {
  try {
    const { start, end, locationId } = req.query;
    if (!start || !end || !locationId)
      return res
        .status(400)
        .json({ error: "start, end, and locationId are required" });

    const { data } = await nh.get("/appointments", {
      params: { subdomain: SUBDOMAIN, location_id: locationId, start, end },
    });
    res.json({ code: true, data });
  } catch (e) {
    res
      .status(e?.response?.status || 500)
      .json(e?.response?.data || { error: "list appointments failed" });
  }
});

/**
 * (Optional) POST /api/appointments/:id/cancel
 */
router.post("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    await nh.delete(`/appointments/${id}`, {
      params: { subdomain: SUBDOMAIN },
    });
    res.json({ code: true, data: { appointment_id: id, status: "canceled" } });
  } catch (e) {
    res
      .status(e?.response?.status || 500)
      .json(e?.response?.data || { error: "cancel failed" });
  }
});

export default router;
