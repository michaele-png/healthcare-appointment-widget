import React, { useEffect, useMemo, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api, Slot } from '../api/api';
import WeekCalendar from '../components/WeekCalendar';

const toYMD = (d: Date) => d.toISOString().slice(0, 10);

export default function DateTimeSelectionStep() {
  const { bookingData, setCurrentStep, updateBookingData, goBack } = useWidget();

  const providerId = String(bookingData.provider?.id ?? '');
  const locationId = String(bookingData.locationId ?? bookingData.provider?.location_id ?? '');

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [offsetDays, setOffsetDays] = useState(0); // prev/next week

  // 7-day window starting today + offset
  const range = useMemo(() => {
    const from = new Date(); from.setDate(from.getDate() + offsetDays);
    const to = new Date(from); to.setDate(to.getDate() + 6);
    return { from: toYMD(from), to: toYMD(to) };
  }, [offsetDays]);

  useEffect(() => {
    if (!providerId || !locationId) return;
    setLoading(true);
    api.availability(providerId, range.from, range.to, locationId)
      .then(setSlots)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [providerId, locationId, range.from, range.to]);

  const onSelect = (iso: string) => {
    updateBookingData({ selectedSlot: { start_time: iso, start: iso } });
  };

  const selectedISO = bookingData.selectedSlot?.start_time ?? bookingData.selectedSlot?.start;

  return (
    <div className="step">
      <h3 className="text-lg font-semibold mb-2">Pick a time</h3>

      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-600">Times shown in your local timezone</div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setOffsetDays((d) => Math.max(0, d - 7))} disabled={offsetDays <= 0}>
            ⟵ Prev week
          </button>
          <button className="btn" onClick={() => setOffsetDays((d) => d + 7)}>
            Next week ⟶
          </button>
        </div>
      </div>

      {err && <div className="error mb-2">{err}</div>}
      {loading && <div className="text-sm text-gray-500 mb-2">Loading availability…</div>}

      <WeekCalendar
        slots={slots}
        selected={selectedISO ?? undefined}
        onSelect={onSelect}
        days={7}
      />

      <div className="actions flex gap-2 mt-3">
        <button className="btn" onClick={goBack}>Back</button>
        <button
          className="btn btn-primary"
          onClick={() => setCurrentStep('patient-info')}
          disabled={!selectedISO}
        >
          Next
        </button>
      </div>
    </div>
  );
}
