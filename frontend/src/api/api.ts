const BASE =
  import.meta.env.VITE_BACKEND_URL ??
  'https://healthcare-appointment-widget-production.up.railway.app';

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export type Location = { id: string; name: string };
export type Provider = { id: string; name: string };
export type VisitType = { id: string; name: string; duration?: number };
export type Slot = { start: string; end?: string };

export const api = {
  // ...
  visitTypes: (providerId: string|number, locationId: string|number) =>
    fetch(`${BASE}/api/providers/visit-types?providerId=${encodeURIComponent(String(providerId))}&locationId=${encodeURIComponent(String(locationId))}`)
      .then(j<any>)
      .then(r => {
        const rows = Array.isArray(r?.data) ? r.data : r;
        return rows.map((vt: any) => ({ id: String(vt.id ?? vt.appointment_type_id), name: vt.name ?? vt.title ?? 'Visit', duration: vt.duration }));
      }),
  // ...
};
  providers: (locationId: string) =>
    fetch(`${BASE}/api/providers?locationId=${encodeURIComponent(locationId)}`)
      .then(j<any>)
      .then(r => {
        const rows = Array.isArray(r?.data) ? r.data : r;
        return rows.map((p: any) => ({
          id: String(p.id ?? p.uuid ?? p.provider_id ?? p.name),
          name: p.name ?? p.display_name ?? 'Provider',
        })) as Provider[];
      }),

  visitTypes: (providerId: string) =>
    fetch(`${BASE}/api/providers/visit-types?providerId=${encodeURIComponent(providerId)}`)
      .then(j<any>)
      .then(r => {
        const rows = Array.isArray(r?.data) ? r.data : r;
        return rows.map((vt: any) => ({
          id: String(vt.id ?? vt.appointment_type_id),
          name: vt.name ?? vt.title ?? 'Visit',
          duration: vt.duration,
        })) as VisitType[];
      }),

  availability: (providerId: string, fromISO: string, toISO: string) =>
    fetch(
      `${BASE}/api/availability?providerId=${encodeURIComponent(
        providerId
      )}&from=${fromISO}&to=${toISO}`
    )
      .then(j<any>)
      .then(r => {
        const rows = Array.isArray(r?.data) ? r.data : r;
        return rows.map((s: any) => ({
          start: s.start ?? s.slotStart,
          end: s.end,
        })) as Slot[];
      }),

  createAppointment: (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    providerId: string;
    locationId: string;
    visitTypeId: string;
    slotStart: string;
  }) =>
    fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(j<{ ok: boolean; appointmentId?: string }>()),
};
