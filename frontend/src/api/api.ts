export const BASE =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-appointment-widget-production.up.railway.app";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

// ---- Types ----
export type Location = { id: string | number; name: string };
export type Provider = { id: string | number; name: string };
export type VisitType = { id: string | number; name: string; duration?: number };
export type Slot = { start: string; end?: string };

// ---- API =========
export const api = {
  // Prefer a clean /api/locations; fallback to /api/providers/locations if needed
  locations: async (): Promise<Location[]> => {
    try {
      const r: any = await fetch(`${BASE}/api/locations`, {
        headers: { Accept: "application/json" },
      }).then(j<any>);
      const rows = Array.isArray(r?.data) ? r.data : r;
      return rows.map((l: any) => ({ id: String(l.id), name: l.name })) as Location[];
    } catch {
      // Fallback shape to NexHealth-style providers/locations payload
      const r: any = await fetch(`${BASE}/api/providers/locations`, {
        headers: { Accept: "application/json" },
      }).then(j<any>);
      if (Array.isArray(r)) return r as Location[];
      const inst = r?.data?.[0];
      const locs = inst?.locations ?? [];
      return locs.map((l: any) => ({ id: String(l.id), name: l.name })) as Location[];
    }
  },

  // locationId REQUIRED by backend for all calls
  providers: async (locationId: string | number): Promise<Provider[]> => {
    const r: any = await fetch(
      `${BASE}/api/providers?locationId=${encodeURIComponent(String(locationId))}`
    ).then(j<any>);
    const rows = Array.isArray(r?.data) ? r.data : r;
    return rows.map((p: any) => ({
      id: String(p.id ?? p.provider_id ?? p.uuid ?? p.name),
      name: p.name ?? p.display_name ?? "Provider",
    })) as Provider[];
  },

  // backend ignores providerId here (ok), but keep it for compatibility
  visitTypes: async (providerId: string | number, locationId: string | number): Promise<VisitType[]> => {
    const r: any = await fetch(
      `${BASE}/api/providers/visit-types?providerId=${encodeURIComponent(
        String(providerId)
      )}&locationId=${encodeURIComponent(String(locationId))}`
    ).then(j<any>);
    const rows = Array.isArray(r?.data) ? r.data : r;
    return rows.map((vt: any) => ({
      id: String(vt.id ?? vt.appointment_type_id),
      name: vt.name ?? vt.title ?? "Visit",
      duration: vt.duration ?? vt.minutes,
    })) as VisitType[];
  },

  // IMPORTANT: your backend expects from/to (not start/end)
  availability: async (
    providerId: string | number,
    startISO: string, // YYYY-MM-DD inclusive
    endISO: string,   // YYYY-MM-DD exclusive
    locationId: string | number
  ): Promise<Slot[]> => {
    const url =
      `${BASE}/api/availability?providerId=${encodeURIComponent(String(providerId))}` +
      `&locationId=${encodeURIComponent(String(locationId))}` +
      `&from=${startISO}&to=${endISO}`;
    const r: any = await fetch(url).then(j<any>);
    const rows = Array.isArray(r?.data) ? r.data : r;
    return rows.map((s: any) => ({
      start: s.start ?? s.slotStart ?? s.start_time,
      end: s.end ?? s.slotEnd ?? s.end_time,
    })) as Slot[];
  },

  createAppointment: (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    providerId: number;
    locationId: number;
    visitTypeId: number;
    slotStart: string; // ISO
  }) =>
    fetch(`${BASE}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // send BOTH styles so backend can accept either
      body: JSON.stringify({
        ...payload,
        provider_id: payload.providerId,
        location_id: payload.locationId,
        visit_type_id: payload.visitTypeId,
        slot_start: payload.slotStart,
      }),
    }).then(j<{ ok: boolean; appointmentId?: string }>()),
};
