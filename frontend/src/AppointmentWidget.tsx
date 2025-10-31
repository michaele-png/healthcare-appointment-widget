
import React, { useEffect, useMemo, useState } from 'react';
import { api, Location, Provider, VisitType, Slot } from './api';

type Step = 'location' | 'provider' | 'visit' | 'slot' | 'details' | 'done';

const fmtLocal = (iso: string) => new Date(iso).toLocaleString();

export default function AppointmentWidget() {
  const [step, setStep] = useState<Step>('location');

  const [locations, setLocations] = useState<Location[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [visits, setVisits] = useState<VisitType[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [locationId, setLocationId] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [visitTypeId, setVisitTypeId] = useState<string>('');
  const [slotStart, setSlotStart] = useState<string>('');

  const [firstName, setFirstName] = useState(''); 
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(''); 
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Step 1: load locations
  useEffect(() => {
    setLoading(true);
    api.locations()
      .then(setLocations)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Step 2: load providers when location changes
  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    api.providers(locationId)
      .then(setProviders)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [locationId]);

  // Step 3: load visit types when provider changes
  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    api.visitTypes(providerId)
      .then(setVisits)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [providerId]);

  // Step 4: load availability when visit is chosen (current week → +14 days)
  useEffect(() => {
    if (!providerId || !visitTypeId) return;
    const from = new Date();
    const to = new Date(); to.setDate(to.getDate() + 14);
    const fromISO = from.toISOString().slice(0,10);
    const toISO = to.toISOString().slice(0,10);
    setLoading(true);
    api.availability(providerId, fromISO, toISO)
      .then(setSlots)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [providerId, visitTypeId]);

  const canNext = useMemo(() => {
    if (step === 'location') return !!locationId;
    if (step === 'provider') return !!providerId;
    if (step === 'visit')    return !!visitTypeId;
    if (step === 'slot')     return !!slotStart;
    if (step === 'details')  return firstName && lastName && phone && email;
    return false;
  }, [step, locationId, providerId, visitTypeId, slotStart, firstName, lastName, phone, email]);

  const onSubmit = async () => {
    try {
      setLoading(true); setErr(null);
      const res = await api.createAppointment({
        firstName, lastName, phone, email,
        providerId, locationId, visitTypeId, slotStart,
      });
      if (!res.ok) throw new Error('Booking failed');
      setConfirmId(res.appointmentId ?? 'pending');
      setStep('done');
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto rounded-2xl shadow p-6 space-y-4 font-sans">
      <h2 className="text-2xl font-semibold">Book an appointment</h2>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">{err}</div>}
      {loading && <div className="text-sm opacity-70">Loading…</div>}

      {step === 'location' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Location</label>
          <select className="w-full border rounded p-2"
            value={locationId}
            onChange={e => setLocationId(e.target.value)}>
            <option value="">Select a location</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      {step === 'provider' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Provider</label>
          <select className="w-full border rounded p-2"
            value={providerId}
            onChange={e => setProviderId(e.target.value)}>
            <option value="">Select a provider</option>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {step === 'visit' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Visit type</label>
          <select className="w-full border rounded p-2"
            value={visitTypeId}
            onChange={e => setVisitTypeId(e.target.value)}>
            <option value="">Select a visit type</option>
            {visits.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      )}

      {step === 'slot' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Available times</label>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-auto border rounded p-2">
            {slots.length === 0 && <div className="col-span-2 text-sm opacity-70">No slots found in the next 14 days.</div>}
            {slots.map((s, i) => (
              <button key={i}
                className={`border rounded p-2 text-sm text-left ${slotStart===s.start ? 'ring-2 ring-black' : ''}`}
                onClick={() => setSlotStart(s.start)}>
                {fmtLocal(s.start)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <input className="border rounded p-2" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
          <input className="border rounded p-2 md:col-span-2" placeholder="Phone (+1…)" value={phone} onChange={e => setPhone(e.target.value)} />
          <input className="border rounded p-2 md:col-span-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      )}

      {step === 'done' && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded">
          Appointment booked! Confirmation: <b>{confirmId}</b>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <div className="text-sm opacity-60">Step: {step}</div>
        <div className="space-x-2">
          {step !== 'location' && step !== 'done' && (
            <button className="px-3 py-2 border rounded" onClick={() => setStep(
              step === 'provider' ? 'location' :
              step === 'visit'    ? 'provider' :
              step === 'slot'     ? 'visit'    :
              'slot'
            )}>Back</button>
          )}
          {step !== 'done' && (
            <button
              className={`px-4 py-2 rounded ${canNext ? 'bg-black text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              disabled={!canNext}
              onClick={() => {
                if (step === 'location') setStep('provider');
                else if (step === 'provider') setStep('visit');
                else if (step === 'visit') setStep('slot');
                else if (step === 'slot') setStep('details');
                else if (step === 'details') onSubmit();
              }}
            >
              {step === 'details' ? 'Book' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
