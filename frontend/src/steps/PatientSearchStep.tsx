import React, { useState } from 'react';
import { useWidget } from '../context/WidgetContext';

export default function PatientSearchStep(){
  const { setCurrentStep, updateBookingData } = useWidget();
  const [email,setEmail] = useState(''); const [phone,setPhone] = useState('');
  function next(){
    updateBookingData({ patient: { first_name:'', last_name:'', date_of_birth:'1990-01-01', email, phone } });
    setCurrentStep('provider-selection');
  }
  return (<div>
    <h3 className="text-lg font-semibold mb-2">Find your profile</h3>
    <input className="input mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
    <input className="input mb-2" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
    <button className="btn btn-primary" onClick={next}>Continue</button>
  </div>);
}
