import React, { useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api } from '../api/api';

export default function ConfirmationStep() {
  const { setCurrentStep, bookingData } = useWidget();
  const [loading, setLoading] = useState(false);

  async function submit() {
    const { provider, appointmentType, selectedSlot, patient } = bookingData || {};
    if (!provider || !appointmentType || !selectedSlot || !patient) return;

    setLoading(true);
    try {
      // Map your UI model → backend payload the API expects
      await api.createAppointment({
        firstName: patient.first_name ?? patient.firstName ?? '',
        lastName:  patient.last_name  ?? patient.lastName  ?? '',
        phone:     patient.phone      ?? '',
        email:     patient.email      ?? '',
        providerId:   String(provider.id),
        locationId:   String(provider.location_id ?? bookingData.locationId ?? ''), // adjust if you store it elsewhere
        visitTypeId:  String(appointmentType.id),
        slotStart:    String(selectedSlot.start_time ?? selectedSlot.start ?? ''),
      });

      setCurrentStep('success');
    } catch (e) {
      alert('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Confirm</h3>
      <ul className="text-sm mb-3">
        <li>Provider: {bookingData.provider?.name}</li>
        <li>Type: {bookingData.appointmentType?.name}</li>
        <li>Time: {bookingData.selectedSlot ? new Date(bookingData.selectedSlot.start_time ?? bookingData.selectedSlot.start).toLocaleString() : '-'}</li>
        <li>Email: {bookingData.patient?.email}</li>
      </ul>
      <button className="btn btn-primary" onClick={submit} disabled={loading}>
        {loading ? 'Booking...' : 'Book appointment'}
      </button>
    </div>
  );
}
