const BASE = import.meta.env.VITE_BACKEND_URL ?? 'https://healthcare-appointment-widget-production.up.railway.app';

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export type Location = { id: number|string; name: string };
export type Provider = { id: number|string; name: string };
export type VisitType = { id: number|string; name: string; duration?: number };
export type Slot = { start: string; end?: string };

export const api = {
  locations: () => fetch(`${BASE}/api/providers/locations`).then(j<any>).then(r => {

    if (Array.isArray(r)) return r as Location[];
    const inst = r?.data?.[0];
    const locs = inst?.locations ?? [];
    return locs.map((l: any) => ({ id: String(l.id), name: l.name })) as Location[];
  }),
  providers: (locationId: string|number) =>
    fetch(`${BASE}/api/providers?locationId=${encodeURIComponent(String(locationId))}`).then(j<any>).then(r => {
      const rows = Array.isArray(r?.data) ? r.data : r;
      return rows.map((p: any) => ({ id: String(p.id ?? p.provider_id ?? p.uuid ?? p.name), name: p.name ?? p.display_name ?? 'Provider' })) as Provider[];
    }),
  visitTypes: (providerId: string|number) =>
    fetch(`${BASE}/api/providers/visit-types?providerId=${encodeURIComponent(String(providerId))}`).then(j<any>).then(r => {
      const rows = Array.isArray(r?.data) ? r.data : r;
      return rows.map((vt: any) => ({ id: String(vt.id ?? vt.appointment_type_id), name: vt.name ?? vt.title ?? 'Visit', duration: vt.duration })) as VisitType[];
    }),
  availability: (providerId: string|number, fromISO: string, toISO: string) =>
    fetch(`${BASE}/api/availability?providerId=${encodeURIComponent(String(providerId))}&from=${fromISO}&to=${toISO}`).then(j<any>).then(r => {
      const rows = Array.isArray(r?.data) ? r.data : r;
      return rows.map((s: any) => ({ start: s.start ?? s.slotStart, end: s.end })) as Slot[];
    }),
  createAppointment: (payload: {
    firstName: string; lastName: string; phone: string; email: string;
    providerId: string|number; locationId: string|number; visitTypeId: string|number; slotStart: string;
  }) =>
    fetch(`${BASE}/api/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(j<{ ok: boolean; appointmentId?: string }>()),
};
