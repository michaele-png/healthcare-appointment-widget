import React from 'react';
import type { BookingStep } from '../types';
const steps: BookingStep[] = ['patient-search','provider-selection','appointment-type','datetime-selection','patient-info','confirmation','success'];
export const StepIndicator: React.FC<{ current: BookingStep }> = ({ current }) => (
  <ol className="flex flex-wrap gap-2 text-xs mb-3">
    {steps.map((s,i)=>{
      const active = s===current;
      return <li key={s} className={`px-2 py-1 rounded-full border ${active?'bg-gray-900 text-white border-gray-900':'text-gray-700 border-gray-200'}`}><span className="mr-1">{i+1}.</span>{label(s)}</li>
    })}
  </ol>
);
function label(s:BookingStep){
  switch(s){
    case 'patient-search': return 'Find Patient';
    case 'provider-selection': return 'Provider';
    case 'appointment-type': return 'Type';
    case 'datetime-selection': return 'Date & Time';
    case 'patient-info': return 'Details';
    case 'confirmation': return 'Review';
    case 'success': return 'Done';
  }
}
