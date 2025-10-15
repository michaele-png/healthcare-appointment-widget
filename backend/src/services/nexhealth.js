import axios from 'axios';

const enabled = !!process.env.NEXHEALTH_API_KEY && !!process.env.NEXHEALTH_SUBDOMAIN;
const baseURL = enabled ? `https://${process.env.NEXHEALTH_SUBDOMAIN}.nexhealth.com/api/${process.env.NEXHEALTH_API_VERSION}` : '';
const client = axios.create({
  baseURL: baseURL || 'http://localhost/disabled-nexhealth',
  timeout: 12000,
  headers: enabled ? { Authorization: `Bearer ${process.env.NEXHEALTH_API_KEY}` } : {}
});

export async function nhGetProviders() {
  if (!enabled) return [];
  const { data } = await client.get('/providers');
  return data;
}
export async function nhGetAvailability(params) {
  if (!enabled) return [];
  const { data } = await client.get('/availability', { params });
  return data;
}
export async function nhCreateAppointment(payload) {
  if (!enabled) return { id: null };
  const { data } = await client.post('/appointments', payload);
  return data;
}
export async function nhCancelAppointment(id) {
  if (!enabled) return true;
  await client.delete(`/appointments/${id}`);
}
