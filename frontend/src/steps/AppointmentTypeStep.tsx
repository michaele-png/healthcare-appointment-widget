import React, { useEffect, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { AppointmentType } from '../types';

export default function AppointmentTypeStep(){
  const { setCurrentStep, updateBookingData } = useWidget();
  const [types, setTypes] = useState<AppointmentType[]>([]);
  useEffect(()=>{ setTypes([{id:'type-cleaning', name:'Cleaning', duration_minutes:30},{id:'type-exam', name:'Exam', duration_minutes:45}]); },[]);
  return (<div>
    <h3 className="text-lg font-semibold mb-3">Appointment Type</h3>
    <div className="grid gap-2">{types.map(t=>(<button key={t.id} className="btn" onClick={()=>{ updateBookingData({ appointmentType: t }); setCurrentStep('datetime-selection'); }}>{t.name} · {t.duration_minutes}m</button>))}</div>
  </div>);
}
