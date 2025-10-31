import React, { useMemo, useState } from 'react';
import { useWidget } from '../context/WidgetContext';

const emailOk = (s: string) => /^\S+@\S+\.\S+$/.test(s);
const phoneOk  = (s: string) => s.replace(/\D/g,'').length >= 10;

export default function PatientSearchStep() {
  const { setCurrentStep, updateBookingData, bookingData } = useWidget();
  const [email, setEmail] = useState(bookingData.patient?.email ?? '');
  const [phone, setPhone] = useState(bookingData.patient?.phone ?? '');

  const canNext = useMemo(() => emailOk(email) || phoneOk(phone), [email, phone]);

  function next() {
    // Seed patient object; you can expand this later with a real “returning patient” lookup
    updateBookingData({
      patient: {
        ...(bookingData.patient ?? {}),
        email: email.trim(),
        phone: phone.trim(),
        // keep placeholders if you want them initialized early
        first_name: bookingData.patient?.first_name ?? '',
        last_name:  bookingData.patient?.last_name  ?? '',
        date_of_birth: bookingData.patient?.date_of_birth ?? '1990-01-01',
      },
    });
    setCurrentStep('provider-selection');
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Find your profile</h3>
      <p className="text-sm text-gray-600 mb-3">Enter your email or phone to continue.</p>

      <input
        className="input mb-2"
        placeholder="Email (optional)"
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="email"
      />

      <input
        className="input mb-3"
        placeholder="Phone (optional)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        inputMode="tel"
      />

      <button
        className="btn btn-primary"
        onClick={next}
        disabled={!canNext}
        title={!canNext ? 'Enter a valid email or phone' : ''}
      >
        Continue
      </button>
    </div>
  );
}
