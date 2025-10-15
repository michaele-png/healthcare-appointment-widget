import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppointmentWidget } from './AppointmentWidget';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppointmentWidget practiceId="demo-practice" clinicName="Acme Clinic" brandHue={212} />
  </React.StrictMode>
);
