import React from 'react';
import { useWidget } from '../context/WidgetContext';

export default function SuccessStep() {
  const { bookingData, confirmationId } = useWidget();
  const whenISO = bookingData.selectedSlot?.start_time ?? bookingData.selectedSlot?.start;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">You’re booked 🎉</h3>
      <p className="text-sm text-gray-700 mb-3">
        We’ve sent a confirmation. You’ll also receive reminders before your visit.
      </p>

      <ul className="text-sm mb-4">
        <li><b>Confirmation:</b> {confirmationId ?? 'pending'}</li>
        <li><b>Patient:</b> {bookingData.patient?.first_name} {bookingData.patient?.last_name}</li>
        <li><b>Provider:</b> {bookingData.provider?.name ?? '-'}</li>
        <li><b>Type:</b> {bookingData.appointmentType?.name ?? '-'}</li>
        <li><b>Time:</b> {whenISO ? new Date(whenISO).toLocaleString() : '-'}</li>
        <li><b>Email:</b> {bookingData.patient?.email ?? '-'}</li>
        <li><b>Phone:</b> {bookingData.patient?.phone ?? '-'}</li>
      </ul>

      <div className="text-xs text-gray-500">
        Having trouble? Reply to your confirmation email to contact the office.
      </div>
    </div>
  );
}
