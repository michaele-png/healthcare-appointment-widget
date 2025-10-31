import { Router } from "express";
import { nh, SUBDOMAIN, NH_ENABLED } from "../lib/nexhealth.js";

const router = Router();

/**
 * GET /api/availability
 * Accepts both naming styles and both date key names.
 * Query:
 *   - providerId | provider_id   (optional for some NH accounts)
 *   - locationId | location_id   (required)
 *   - from | start               (YYYY-MM-DD, inclusive)
 *   - to   | end                 (YYYY-MM-DD, exclusive)
 */
router.get("/", async (req, res) => {
  try {
    const providerId = req.query.providerId || req.query.provider_id || null;
    const locationId = req.query.locationId || req.query.location_id;
    const from = req.query.from || req.query.start;
    const to = req.query.to || req.query.end;

    if (!locationId || !from || !to) {
      return res.status(400).json({
        code: false,
        error: ["Missing locationId, from/start, or to/end"],
      });
    }

    // --------------------------------------------
    // DEMO/OFF mode (only when NH explicitly disabled)
    // --------------------------------------------
    if (String(NH_ENABLED).toLowerCase() === "false") {
      const first = new Date(`${from}T00:00:00.000Z`);
      const out = [];
      for (let i = 0; i < 7; i++) {
        const d1 = new Date(first); d1.setUTCDate(d1.getUTCDate() + i); d1.setUTCHours(15, 0, 0, 0);
        const d2 = new Date(first); d2.setUTCDate(d2.getUTCDate() + i); d2.setUTCHours(20, 0, 0, 0);
        out.push({ start: d1.toISOString() }, { start: d2.toISOString() });
      }
      return res.json({ code: true, data: out });
    }

    // --------------------------------------------
    // NEXHEALTH MODE

    const baseParams = {
      subdomain: SUBDOMAIN,
      location_id: locationId,
      start_date: from,
      end_date: to,
    };

    const withProvider = providerId
      ? { ...baseParams, provider_id: providerId }
      : baseParams;

    const tryNH = async (path, params) => {
      const { data } = await nh.get(path, { params });
      return data;
    };

    let data = null;
    let tried = [];

    const attempts = [];

    if (providerId) {
      attempts.push({ path: "/available_times", params: withProvider });
      attempts.push({ path: "/availability", params: withProvider });
    } else {
      attempts.push({ path: "/available_times", params: baseParams });
      attempts.push({ path: "/availability", params: baseParams });
    }

    let lastErrStatus = null;

    for (const a of attempts) {
      try {
        tried.push(a);
        data = await tryNH(a.path, a.params);
        break; // success
      } catch (e) {
        const status = e?.response?.status;
        lastErrStatus = status;
        // If not 404, bubble it up (auth/network/etc.)
        if (status !== 404) throw e;
        // else continue loop and try next variant
      }
    }

    if (!data && providerId) {
      // Retry without provider filter (location-only)
      const locationOnlyAttempts = [
        { path: "/available_times", params: baseParams },
        { path: "/availability", params: baseParams },
      ];
      for (const a of locationOnlyAttempts) {
        try {
          tried.push(a);
          data = await tryNH(a.path, a.params);
          break;
        } catch (e) {
          const status = e?.response?.status;
          lastErrStatus = status;
          if (status !== 404) throw e;
        }
      }
    }

    // If still nothing and last error was 404, treat as "no slots"
    if (!data && lastErrStatus === 404) {
      return res.json({ code: true, data: [] });
    }

    // Normalize various NH shapes → [{ start, end? }, ...]
    const rows = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.available_times)
      ? data.available_times
      : Array.isArray(data)
      ? data
      : [];

    const slots = rows
      .map((s) => ({
        start: s.start ?? s.start_time ?? s.begin ?? s.time ?? s.slotStart,
        end: s.end ?? s.end_time ?? s.slotEnd ?? undefined,
      }))
      .filter((s) => !!s.start);

    return res.json({ code: true, data: slots });
  } catch (e) {
    const status = e?.response?.status || 500;
    const body = e?.response?.data || { error: e.message };
    console.error("NH /availability error:", status, body);
    res.status(status).json(body);
  }
});

export default router;
