export const BASE =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-appointment-widget-production.up.railway.app";


function qs(params: Record<string, string | number | boolean | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.set(k, String(v));
    if (k === "locationId") u.set("location_id", String(v));
    if (k === "location_id") u.set("locationId", String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

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

// ---- API ----
export const api = {
  // NOTE: If /api/providers/locations is not implemented on your backend, you can remove this.
  locations: async (): Promise<Location[]> => {
    const r: any = await fetch(`${BASE}/api/providers/locations`).then(j<any>);
    if (Array.isArray(r)) return r as Location[];
    const inst = r?.data?.[0];
    const locs = inst?.locations ?? [];
    return locs.map((l: any) => ({ id: String(l.id), name: l.name })) as Location[];
  },

  providers: async (locationId: string | number): Promise<Provider[]> => {
    const r: any = await fetch(
      `${BASE}/api/providers${qs({ locationId })}`
    ).then(j<any>);
    const rows = Array.isArray(r?.data) ? r.data : r;
    return rows.map((p: any) => ({
      id: String(p.id ?? p.provider_id ?? p.uuid ?? p.name),
      name: p.name ?? p.display_name ?? "Provider",
    })) as Provider[];
  },

  // visit types REQUIRE locationId (your backend ignores providerId, which is fine)
  visitTypes: async (providerId: string | number, locationId: string | number): Promise<VisitType[]> => {
    const r: any = await fetch(
      `${BASE}/api/providers/visit-types${qs({ providerId, locationId })}`
    ).then(j<any>);
    const rows = Array.isArray(r?.data) ? r.data : r;
    return rows.map((vt: any) => ({
      id: String(vt.id ?? vt.appointment_type_id),
      name: vt.name ?? vt.title ?? "Visit",
      duration: vt.duration ?? vt.minutes,
    })) as VisitType[];
  },

  // FIXED: uses start/end (not from/to) and includes locationId
  availability: async (
    providerId: string | number,
    startISO: string, // YYYY-MM-DD (inclusive)
    endISO: string,   // YYYY-MM-DD (exclusive)
    locationId: string | number
  ): Promise<Slot[]> => {
    const r: any = await fetch(
      `${BASE}/api/availability${qs({ providerId, locationId, start: startISO, end: endISO })}`
    ).then(j<any>);
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
    providerId: string | number;
    locationId: string | number;
    visitTypeId: string | number;
    slotStart: string; // ISO
  }) =>
    fetch(`${BASE}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(j<{ ok: boolean; appointmentId?: string }>()),
};
