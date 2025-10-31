import React, { useEffect, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api, VisitType } from '../api/api';

export default function AppointmentTypeStep() {
  const {
    selectedProviderId,
    selectedVisitTypeId,
    setSelectedVisitTypeId,
    goNext,
    goBack,
  } = useWidget();

  const [types, setTypes] = useState<VisitType[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProviderId) return;
    api.visitTypes(selectedProviderId)
      .then(setTypes)
      .catch(e => setErr(e.message));
  }, [selectedProviderId]);

  return (
    <div className="step">
      <h3 className="text-lg font-semibold mb-3">Appointment Type</h3>

      {err && <div className="error">{err}</div>}

      <select
        className="w-full border rounded p-2"
        value={selectedVisitTypeId ?? ''}
        onChange={e => setSelectedVisitTypeId(e.target.value)}
      >
        <option value="">Select a visit type</option>
        {types.map(v => (
          <option key={v.id} value={v.id}>
            {v.name} · {v.duration ?? '--'}m
          </option>
        ))}
      </select>

      <div className="actions flex gap-2 mt-3">
        <button className="btn" onClick={goBack}>Back</button>
        <button
          className="btn-primary"
          disabled={!selectedVisitTypeId}
          onClick={goNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
