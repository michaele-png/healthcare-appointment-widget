import axios from 'axios';

const NH_BASE_URL    = process.env.NH_BASE_URL || 'https://nexhealth.info';
const NH_API_KEY     = process.env.NH_API_KEY;          // long-lived key (from portal)
export const SUBDOMAIN = process.env.NH_SUBDOMAIN;      // e.g. 'caprium-demo-practice'


let bearer = process.env.NH_BEARER || null;
let bearerExpiresAt = 0;

async function fetchBearer() {
  const res = await axios.post(`${NH_BASE_URL}/authenticates`, null, {
    headers: {
    
      Authorization: NH_API_KEY,
      'Nex-Api-Version': 'v2',
    },
    timeout: 15000,
  });
  const token = res.data?.token || res.data?.bearer || res.data?.access_token;
  if (!token) throw new Error('No bearer token returned from /authenticates');
  bearer = token;

  // Try to read JWT exp; default ~55m if not present
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    bearerExpiresAt = ((payload.exp ? payload.exp * 1000 : Date.now() + 55 * 60 * 1000) - 15 * 1000);
  } catch {
    bearerExpiresAt = Date.now() + 55 * 60 * 1000;
  }
}

async function ensureBearer() {
  if (!bearer || Date.now() >= bearerExpiresAt) {
    await fetchBearer();
  }
}

export const nh = axios.create({
  baseURL: NH_BASE_URL,
  timeout: 15000,
});

nh.interceptors.request.use(async (config) => {
  await ensureBearer();
  config.headers = {
    ...(config.headers || {}),
    Authorization: `Bearer ${bearer}`,
    Accept: 'application/vnd.Nexhealth+json;version=2',
    'Content-Type': 'application/json',
  };
  return config;
});
