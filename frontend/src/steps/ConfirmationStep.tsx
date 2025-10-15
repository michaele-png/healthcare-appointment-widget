import React, { useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api } from '../api/client';

export default function ConfirmationStep(){
  const { setCurrentStep, bookingData } = useWidget();
  const [loading,setLoading]=useState(false);
  async function submit(){
    if (!bookingData.provider || !bookingData.appointmentType || !bookingData.selectedSlot || !bookingData.patient) return;
    setLoading(true);
    try {
      await api.createAppointment({
        provider_id: bookingData.provider.id,
        appointment_type_id: bookingData.appointmentType.id,
        start_time: bookingData.selectedSlot.start_time,
        patient: bookingData.patient,
        reason: bookingData.reason,
        insurance_info: bookingData.insuranceInfo
      });
      setCurrentStep('success');
    } catch (e){ alert('Failed to create appointment'); } finally { setLoading(false); }
  }
  return (<div>
    <h3 className="text-lg font-semibold mb-2">Confirm</h3>
    <ul className="text-sm mb-3">
      <li>Provider: {bookingData.provider?.name}</li>
      <li>Type: {bookingData.appointmentType?.name}</li>
      <li>Time: {bookingData.selectedSlot ? new Date(bookingData.selectedSlot.start_time).toLocaleString() : '-'}</li>
      <li>Email: {bookingData.patient?.email}</li>
    </ul>
    <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?'Booking...':'Book appointment'}</button>
  </div>);
}
