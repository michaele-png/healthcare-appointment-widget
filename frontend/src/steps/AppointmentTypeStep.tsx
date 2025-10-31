import React, { useEffect, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api, VisitType } from '../api/api';

export default function AppointmentTypeStep() {
  const {
    bookingData,
    setCurrentStep,
    updateBookingData,
    goBack,
    goNext,
  } = useWidget();

  const providerId = String(bookingData.provider?.id ?? '');
  const [types, setTypes] = useState<VisitType[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) return;
    api.visitTypes(providerId)
      .then(setTypes)
      .catch(e => setErr(e.message));
  }, [providerId]);

  const onSelect = (t: VisitType) => {
    updateBookingData({ appointmentType: { id: t.id, name: t.name, duration: t.duration } });
    setCurrentStep('datetime-selection');
  };

  return (
    <div className="step">
      <h3 className="text-lg font-semibold mb-3">Appointment Type</h3>
      {err && <div className="error">{err}</div>}
      <div className="grid gap-2">
        {types.map(t => (
          <button key={String(t.id)} className="btn" onClick={() => onSelect(t)}>
            {t.name} · {t.duration ?? '--'}m
          </button>
        ))}
        {types.length === 0 && !err && <div className="text-sm text-gray-600">No visit types available.</div>}
      </div>
      <div className="actions flex gap-2 mt-3">
        <button className="btn" onClick={goBack}>Back</button>
        <button className="btn" disabled>Next</button>
      </div>
    </div>
  );
}
