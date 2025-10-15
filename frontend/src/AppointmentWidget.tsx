import React, { useEffect } from 'react';
import { WidgetProvider, useWidget } from './context/WidgetContext';
import { StepIndicator } from './components/StepIndicator';
import PatientSearchStep from './steps/PatientSearchStep';
import ProviderSelectionStep from './steps/ProviderSelectionStep';
import AppointmentTypeStep from './steps/AppointmentTypeStep';
import DateTimeSelectionStep from './steps/DateTimeSelectionStep';
import PatientInfoStep from './steps/PatientInfoStep';
import ConfirmationStep from './steps/ConfirmationStep';
import SuccessStep from './steps/SuccessStep';
import './styles.css';
import { getSocket } from './socket';

type Props = { practiceId: string; clinicName?: string; brandHue?: number };

const Steps = () => {
  const { currentStep } = useWidget();
  switch (currentStep) {
    case 'patient-search': return <PatientSearchStep />;
    case 'provider-selection': return <ProviderSelectionStep />;
    case 'appointment-type': return <AppointmentTypeStep />;
    case 'datetime-selection': return <DateTimeSelectionStep />;
    case 'patient-info': return <PatientInfoStep />;
    case 'confirmation': return <ConfirmationStep />;
    case 'success': return <SuccessStep />;
  }
};

export const AppointmentWidget: React.FC<Props> = ({ practiceId, clinicName = 'Book an Appointment', brandHue = 212 }) => {
  useEffect(()=>{ getSocket(); },[]);
  useEffect(()=>{ document.documentElement.style.setProperty('--brand', `${brandHue} 87% 45%`); },[brandHue]);
  return (
    <WidgetProvider practiceId={practiceId}>
      <div className="widget-container">
        <Header title={clinicName} />
        <hr className="hr" />
        <Steps />
      </div>
    </WidgetProvider>
  );
};

const Header: React.FC<{ title: string }> = ({ title }) => {
  // @ts-ignore
  const { currentStep } = useWidget();
  return (
    <div className="header">
      <div>
        <div className="title">{title}</div>
        <div className="subtitle">Secure online scheduling</div>
      </div>
      <StepIndicator current={currentStep} />
    </div>
  );
};
