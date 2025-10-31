import React from 'react';
import ReactDOM from 'react-dom/client';
import AppointmentWidget from './AppointmentWidget';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppointmentWidget />
  </React.StrictMode>,
);
