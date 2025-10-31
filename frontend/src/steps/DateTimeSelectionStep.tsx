import React, { useEffect, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api, Slot } from '../api/api';
import WeekCalendar from '../components/WeekCalendar';

const toYMD = (d: Date) => d.toISOString().slice(0,10);

export default function DateTimeSelectionStep() {
  const {
    selectedProviderId,
    selectedVisitTypeId,
    selectedSlotStart,
    setSelectedSlotStart,
    goNext,
    goBack,
  } = useWidget();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProviderId || !selectedVisitTypeId) return;
    const from = new Date();
    const to = new Date(); to.setDate(to.getDate()+14);
    setLoading(true);
    api.availability(String(selectedProviderId), toYMD(from), toYMD(to))
      .then(setSlots)
      .catch(e=>setErr(e.message))
      .finally(()=>setLoading(false));
  }, [selectedProviderId, selectedVisitTypeId]);

  return (
    <div className="step">
      <h3 className="text-lg font-semibold mb-3">Pick a time</h3>

      {err && <div className="error">{err}</div>}
      {loading && <div className="muted">Loading availability…</div>}

      <WeekCalendar
        slots={slots}
        selected={selectedSlotStart ?? undefined}
        onSelect={(iso)=>setSelectedSlotStart(iso)}
      />

      <div className="actions flex gap-2 mt-3">
        <button className="btn" onClick={goBack}>Back</button>
        <button className="btn-primary" disabled={!selectedSlotStart} onClick={goNext}>Next</button>
      </div>
    </div>
  );
}
