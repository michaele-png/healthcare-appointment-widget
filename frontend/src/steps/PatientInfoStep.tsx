import React, { useState } from 'react';
import { useWidget } from '../context/WidgetContext';

export default function PatientInfoStep(){
  const { setCurrentStep, bookingData, updateBookingData } = useWidget();
  const [first,setFirst]=useState(bookingData.patient?.first_name||''); const [last,setLast]=useState(bookingData.patient?.last_name||''); const [dob,setDob]=useState(bookingData.patient?.date_of_birth||'1990-01-01');
  function next(){ updateBookingData({ patient: { ...(bookingData.patient||{}), first_name:first, last_name:last, date_of_birth:dob } }); setCurrentStep('confirmation'); }
  return (<div>
    <h3 className="text-lg font-semibold mb-2">Your details</h3>
    <input className="input mb-2" placeholder="First name" value={first} onChange={e=>setFirst(e.target.value)} />
    <input className="input mb-2" placeholder="Last name" value={last} onChange={e=>setLast(e.target.value)} />
    <input type="date" className="input mb-2" value={dob} onChange={e=>setDob(e.target.value)} />
    <button className="btn btn-primary" onClick={next}>Continue</button>
  </div>);
}
