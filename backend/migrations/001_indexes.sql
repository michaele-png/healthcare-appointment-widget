CREATE INDEX idx_patients_email ON patients (email);
CREATE INDEX idx_appointments_patient ON appointments (patient_id, start_time);
CREATE INDEX idx_appointments_provider ON appointments (provider_id, start_time);
