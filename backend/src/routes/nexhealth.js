import express from "express";
import axios from "axios";

const router = express.Router();
const API_BASE = process.env.NEXHEALTH_API_BASE;
const SUBDOMAIN = process.env.NEXHEALTH_SUBDOMAIN;
const API_KEY = process.env.NEXHEALTH_API_KEY;

router.get("/providers", async (req, res) => {
  try {
    const { data } = await axios.get(`${API_BASE}/providers`, {
      params: { subdomain: SUBDOMAIN },
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    res.json(data);
  } catch (err) {
    console.error("Error fetching providers:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch providers" });
  }
});


router.get("/locations", async (req, res) => {
  try {
    const { data } = await axios.get(`${API_BASE}/locations`, {
      params: { subdomain: SUBDOMAIN },
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    res.json(data);
  } catch (err) {
    console.error("Error fetching locations:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

router.get("/visit-types", async (req, res) => {
  try {
    const { data } = await axios.get(`${API_BASE}/appointment_types`, {
      params: { subdomain: SUBDOMAIN },
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    res.json(data);
  } catch (err) {
    console.error("Error fetching visit types:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch visit types" });
  }
});


router.get("/providers/:id/slots", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, locationId, typeId } = req.query;

    const { data } = await axios.get(`${API_BASE}/providers/${id}/appointment_slots`, {
      params: {
        subdomain: SUBDOMAIN,
        date,
        location_id: locationId,
        appointment_type_id: typeId,
      },
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    res.json(data);
  } catch (err) {
    console.error("Error fetching slots:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});


router.post("/appointments", async (req, res) => {
  try {
    const { data } = await axios.post(`${API_BASE}/appointments`, req.body, {
      params: { subdomain: SUBDOMAIN },
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    res.json(data);
  } catch (err) {
    console.error("Error creating appointment:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

export default router;
