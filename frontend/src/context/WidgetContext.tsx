import React, { createContext, useContext, useState } from 'react';
import type { BookingData, BookingStep } from '../types';

interface Ctx { currentStep: BookingStep; setCurrentStep:(s:BookingStep)=>void; bookingData:BookingData; updateBookingData:(d:Partial<BookingData>)=>void; practiceId:string; }
const WidgetContext = createContext<Ctx | null>(null);
export function useWidget(){ const ctx = useContext(WidgetContext); if(!ctx) throw new Error('WidgetContext'); return ctx; }
export const WidgetProvider: React.FC<React.PropsWithChildren<{ practiceId:string }>> = ({children, practiceId}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-search');
  const [bookingData, setBookingData] = useState<BookingData>({});
  const updateBookingData = (d: Partial<BookingData>) => setBookingData(prev=>({ ...prev, ...d }));
  return <WidgetContext.Provider value={{ currentStep, setCurrentStep, bookingData, updateBookingData, practiceId }}>{children}</WidgetContext.Provider>
}
