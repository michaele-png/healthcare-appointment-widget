import React, { createContext, useContext, useMemo, useState } from 'react';

/** ---- Types ---- */

export type FlowStep =
  | 'patient-search'
  | 'provider-selection'
  | 'appointment-type'
  | 'datetime-selection'
  | 'patient-info'
  | 'confirmation'
  | 'success';

export type Patient = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string; // YYYY-MM-DD
  email?: string;
  phone?: string;
  // add more as needed (insurance, address, etc.)
};

export type ProviderRef = {
  id: string | number;
  name?: string;
  location_id?: string | number;
};

export type VisitTypeRef = {
  id: string | number;
  name?: string;
  duration?: number;
};

export type SlotRef = {
  start_time?: string; // ISO
  end_time?: string;   // ISO (optional)
  // also allow { start } from other code paths:
  start?: string;
  end?: string;
};

export type BookingData = {
  locationId?: string | number;
  provider?: ProviderRef;
  appointmentType?: VisitTypeRef;
  selectedSlot?: SlotRef;
  patient?: Patient;
  reason?: string;
  insuranceInfo?: any; // shape TBD
};

/** ---- Deep merge utility (objects only, arrays & primitives are replaced) ---- */
function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge<T extends Record<string, any>>(base: T, patch: Partial<T>): T {
  const out: any = { ...base };
  for (const k of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[k];
    const bv = (base as any)[k];
    if (isPlainObject(bv) && isPlainObject(pv)) {
      out[k] = deepMerge(bv, pv);
    } else {
      out[k] = pv; // replace primitives & arrays
    }
  }
  return out;
}

/** ---- Context ---- */

type Ctx = {
  currentStep: FlowStep;
  setCurrentStep: (s: FlowStep) => void;
  goNext: () => void;
  goBack: () => void;

  bookingData: BookingData;
  updateBookingData: (partial: Partial<BookingData>) => void;

  // Optional convenience setters (use if you like)
  setSelectedLocationId: (id: string | number) => void;
  setSelectedProviderId: (id: string | number, name?: string, location_id?: string | number) => void;
  setSelectedVisitTypeId: (id: string | number, name?: string, duration?: number) => void;
  setSelectedSlotStart: (iso: string) => void;
  setConfirmationId: (id: string) => void; // if you store an id after booking
  confirmationId?: string;
};

const WidgetContext = createContext<Ctx | null>(null);

export function WidgetProvider({
  children,
  practiceId, // kept for your props compatibility (unused here, but available)
}: {
  children: React.ReactNode;
  practiceId?: string;
}) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('patient-search');
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [confirmationId, setConfirmationId] = useState<string | undefined>(undefined);

  // Deep-merge patch into bookingData
  const updateBookingData = (partial: Partial<BookingData>) => {
    setBookingData(prev => deepMerge(prev, partial));
  };

  // Optional helpers that write into bookingData in a consistent shape
  const setSelectedLocationId = (id: string | number) => updateBookingData({ locationId: id });

  const setSelectedProviderId = (id: string | number, name?: string, location_id?: string | number) =>
    updateBookingData({ provider: { id, name, location_id } });

  const setSelectedVisitTypeId = (id: string | number, name?: string, duration?: number) =>
    updateBookingData({ appointmentType: { id, name, duration } });

  const setSelectedSlotStart = (iso: string) =>
    updateBookingData({ selectedSlot: { start_time: iso, start: iso } });

  // Linear step flow (adjust if your flow differs)
  const order: FlowStep[] = [
    'patient-search',
    'provider-selection',
    'appointment-type',
    'datetime-selection',
    'patient-info',
    'confirmation',
    'success',
  ];

  const goNext = () => {
    const i = order.indexOf(currentStep);
    if (i >= 0 && i < order.length - 1) setCurrentStep(order[i + 1]);
  };
  const goBack = () => {
    const i = order.indexOf(currentStep);
    if (i > 0) setCurrentStep(order[i - 1]);
  };

  const value = useMemo<Ctx>(
    () => ({
      currentStep,
      setCurrentStep,
      goNext,
      goBack,
      bookingData,
      updateBookingData,
      setSelectedLocationId,
      setSelectedProviderId,
      setSelectedVisitTypeId,
      setSelectedSlotStart,
      confirmationId,
      setConfirmationId,
    }),
    [currentStep, bookingData, confirmationId]
  );

  return <WidgetContext.Provider value={value}>{children}</WidgetContext.Provider>;
}

export function useWidget() {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error('useWidget must be used inside <WidgetProvider>');
  return ctx;
}
