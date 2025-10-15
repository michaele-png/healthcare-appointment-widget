import React, { useEffect, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api } from '../api/client';
import { TimeSlot } from '../types';

export default function DateTimeSelectionStep(){
  const { setCurrentStep, bookingData, updateBookingData } = useWidget();
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
  const [slots,setSlots]=useState<TimeSlot[]>([]);
  useEffect(()=>{ if(!bookingData.provider) return; api.availability({ provider_id: bookingData.provider.id, date, type_id: bookingData.appointmentType?.id||'' }).then(r=>setSlots(r.slots||[])).catch(()=>setSlots([])); },[bookingData.provider, bookingData.appointmentType, date]);
  return (<div>
    <h3 className="text-lg font-semibold mb-2">Pick a time</h3>
    <input type="date" className="input mb-3" value={date} onChange={e=>setDate(e.target.value)} />
    <div className="grid grid-cols-2 gap-2">
      {slots.filter(s=>s.available).map(s=>(<button key={s.start_time} className="btn" onClick={()=>{ updateBookingData({ selectedDate: date, selectedSlot: s }); setCurrentStep('patient-info'); }}>{new Date(s.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</button>))}
    </div>
  </div>);
}
