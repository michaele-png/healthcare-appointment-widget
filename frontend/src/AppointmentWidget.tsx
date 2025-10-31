import { useEffect, useMemo, useState } from "react";
import type { Location, Provider, VisitType, Slot } from "./api";
import { api } from "./api";

// ===== Config =====
// If VITE_LOCATION_ID is set -> single-location mode
// If it's blank -> multi-location mode (show dropdown)
const LOCATION_ID_ENV = (import.meta as any).env?.VITE_LOCATION_ID || ""; // blank = multi-location
const TZ = "America/New_York";

// ===== Helpers =====
function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const c = new Date(d); c.setUTCDate(c.getUTCDate() + n); return c; }
function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = (copy.getUTCDay() + 6) % 7; // Mon=0
  copy.setUTCDate(copy.getUTCDate() - day);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}
function toLocal(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
  } catch { return iso; }
}
function groupByDate(items: Slot[]) {
  const g: Record<string, Slot[]> = {};
  for (const it of items) {
    const k = (it.start || "").slice(0, 10);
    if (!g[k]) g[k] = [];
    g[k].push(it);
  }
  return g;
}

// ===== UI atoms =====
function Field({ label, children }: { label: string; children: any }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}
function Card({ children }: { children: any }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
      {children}
    </div>
  );
}
function Button(props: any) {
  return (
    <button {...props} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fafafa", cursor: "pointer" }} />
  );
}

// ===== Main b===========
export default function AppointmentWidget() {
  // Locations state: supports both single- and multi-location
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>(LOCATION_ID_ENV ? String(LOCATION_ID_ENV) : "");

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState<string>("");

  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [visitTypeId, setVisitTypeId] = useState<string>("");

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const [slotsByDay, setSlotsByDay] = useState<Record<string, Slot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");

  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Load locations in multi-location mode
  useEffect(() => {
    (async () => {
      if (!LOCATION_ID_ENV) {
        try {
          const list = await api.locations();
          setLocations(list);
          if (list.length && !locationId) setLocationId(String(list[0].id));
        } catch (e: any) {
          setError(`Failed to load locations: ${e.message || String(e)}`);
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!locationId) return;
      try {
        setError("");
        // A) Providers
        const provs = await api.providers(locationId);
        setProviders(provs);
        const firstPid = provs[0]?.id ? String(provs[0].id) : "";
        setProviderId(firstPid);

        // B) Visit types
        if (firstPid) {
          const vts = await api.visitTypes(firstPid, locationId);
          setVisitTypes(vts);
          setVisitTypeId(vts[0]?.id ? String(vts[0].id) : "");
        } else {
          setVisitTypes([]); setVisitTypeId("");
        }

        // C) Availability
        await loadAvailability(firstPid || "", locationId, weekStart);
      } catch (e: any) {
        setError(`Failed to initialize for location ${locationId}: ${e.message || String(e)}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // Reload availability when week or provider changes
  useEffect(() => {
    if (!providerId || !locationId) return;
    loadAvailability(providerId, locationId, weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, providerId]);

  async function loadAvailability(pid: string, locId: string, weekStartDate: Date) {
    if (!pid) { setSlotsByDay({}); return; }
    try {
      setLoadingSlots(true);
      setError("");
      const startISO = fmtDate(weekStartDate);
      const endISO = fmtDate(addDays(weekStartDate, 7)); // exclusive
      const slots = await api.availability(pid, startISO, endISO, locId);
      setSlotsByDay(groupByDate(slots));
    } catch (e: any) {
      setError(`Failed to load availability: ${e.message || String(e)}`);
      setSlotsByDay({});
    } finally {
      setLoadingSlots(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(""); setError("");

    const pid = Number(providerId);
    const loc = Number(locationId);
    const vt = Number(visitTypeId);

    if (!pid || !loc || !vt || !selectedSlot) {
      setError("Please select location, provider, visit type, and a time slot.");
      return;
    }

    const payload = {
      firstName, lastName, phone, email,
      providerId: pid, locationId: loc, visitTypeId: vt,
      slotStart: selectedSlot,
    };

    console.log("POST /api/appointments payload", payload);
    try {
      await api.createAppointment(payload);
      setStatus("Appointment requested!");
    } catch (e: any) {
      setError(`Booking failed: ${e.message || String(e)}`);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Book an Appointment</h1>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Location">
            {LOCATION_ID_ENV ? (
              <input
                value={locationId}
                readOnly
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }}
              />
            ) : (
              <select
                value={locationId}
                onChange={e => { setLocationId(e.target.value); setSelectedSlot(""); }}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }}
              >
                {locations.map(l => (
                  <option key={String(l.id)} value={String(l.id)}>{l.name}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Provider">
            <select
              value={providerId}
              onChange={e => { setProviderId(e.target.value); setSelectedSlot(""); }}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }}
            >
              {providers.map(p => (
                <option key={String(p.id)} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Visit type">
            <select
              value={visitTypeId}
              onChange={e => setVisitTypeId(e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }}
            >
              {visitTypes.map(vt => (
                <option key={String(vt.id)} value={String(vt.id)}>{vt.name}</option>
              ))}
            </select>
          </Field>
        </div>
        {error && <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      </Card>

      <div style={{ height: 10 }} />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>Select a time (week view)</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => setWeekStart(addDays(weekStart, -7))}>Previous</Button>
            <Button onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</Button>
            <Button onClick={() => setWeekStart(addDays(weekStart, 7))}>Next</Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {weekDays.map((day, idx) => {
            const key = fmtDate(day);
            const slots = slotsByDay[key] || [];
            return (
              <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, minHeight: 120, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {loadingSlots ? (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Loading…</div>
                  ) : slots.length ? (
                    slots.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot(s.start)}
                        style={{ fontSize: 12, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 8, background: selectedSlot === s.start ? "#eef2ff" : "#fff", textAlign: "left", cursor: "pointer" }}
                      >
                        {toLocal(s.start)}
                      </button>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>No slots</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {selectedSlot && (
        <>
          <div style={{ height: 10 }} />
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Your details</strong>
              <Button onClick={() => setSelectedSlot("")}>Close</Button>
            </div>
            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
              <Field label="First name"><input value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }} /></Field>
              <Field label="Last name"><input value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }} /></Field>
              <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }} /></Field>
              <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px" }} /></Field>
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8 }}>
                <button type="submit" disabled={!locationId || !providerId || !visitTypeId || !selectedSlot} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fafafa", cursor: "pointer" }}>
                  Confirm appointment at {toLocal(selectedSlot)}
                </button>
                {status && <span style={{ color: "#065f46", fontSize: 13 }}>{status}</span>}
              </div>
            </form>
          </Card>
        </>
      )}

      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
        API: {import.meta.env.VITE_BACKEND_URL || "(default Railway)"} | Location mode: {LOCATION_ID_ENV ? "single" : "multi"} | TZ: {TZ}
      </div>
    </div>
  );
}
