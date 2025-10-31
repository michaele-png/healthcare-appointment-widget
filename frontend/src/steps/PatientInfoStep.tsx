import React, { useMemo, useState } from 'react';
import { useWidget } from '../context/WidgetContext';

const nameOk = (s: string) => s.trim().length >= 2;
const dobOk  = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function PatientInfoStep() {
  const { setCurrentStep, bookingData, updateBookingData } = useWidget();

  const [first, setFirst] = useState(bookingData.patient?.first_name ?? '');
  const [last,  setLast ] = useState(bookingData.patient?.last_name  ?? '');
  const [dob,   setDob  ] = useState(bookingData.patient?.date_of_birth ?? '1990-01-01');

  const canNext = useMemo(() => nameOk(first) && nameOk(last) && dobOk(dob), [first, last, dob]);

  function next() {
    updateBookingData({
      patient: {
        ...(bookingData.patient ?? {}),
        first_name: first.trim(),
        last_name:  last.trim(),
        date_of_birth: dob,
      }
    });
    setCurrentStep('confirmation');
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Your details</h3>

      <div className="grid gap-2">
        <input
          className="input"
          placeholder="First name"
          value={first}
          onChange={e => setFirst(e.target.value)}
        />
        <input
          className="input"
          placeholder="Last name"
          value={last}
          onChange={e => setLast(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={dob}
          onChange={e => setDob(e.target.value)}
        />
      </div>

      <div className="mt-3">
        <button
          className="btn btn-primary"
          onClick={next}
          disabled={!canNext}
          title={!canNext ? 'Please enter your name and a valid DOB (YYYY-MM-DD)' : ''}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
