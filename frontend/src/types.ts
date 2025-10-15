export type BookingStep = 'patient-search'|'provider-selection'|'appointment-type'|'datetime-selection'|'patient-info'|'confirmation'|'success';
export interface Provider { id: string; name: string; specialty?: string; bio?: string; photo_url?: string; accepting_new_patients?: boolean; next_available?: string | null; }
export interface AppointmentType { id: string; name: string; duration_minutes: number; }
export interface Patient { first_name: string; last_name: string; date_of_birth: string; email: string; phone: string; address?: Record<string, any>; }
export interface TimeSlot { start_time: string; end_time: string; available: boolean; }
export interface BookingData { patient?: Patient; provider?: Provider; appointmentType?: AppointmentType; selectedDate?: string; selectedSlot?: TimeSlot; reason?: string; insuranceInfo?: Record<string, any>; }
