import axios from 'axios';

export const NH_ENABLED = (process.env.NH_ENABLED ?? 'true') !== 'false';

const NH_BASE_URL = process.env.NH_BASE_URL || 'https://nexhealth.info';
const NH_API_KEY  = process.env.NH_API_KEY || '';
export const SUBDOMAIN = process.env.NH_SUBDOMAIN || '';

// Fail fast if enabled but missing config
(function assertConfig() {
  if (!NH_ENABLED) return;
  if (!NH_BASE_URL) throw new Error('NH_BASE_URL is required');
  if (!NH_API_KEY)  throw new Error('NH_API_KEY is required');
  if (!SUBDOMAIN)   throw new Error('NH_SUBDOMAIN is required');
})();

// Short-lived bearer cache
let bearer = process.env.NH_BEARER || null;
let bearerExpiresAt = 0; // epoch ms

// Exchange long-lived API key for short-lived bearer
async function fetchBearer() {
  const res = await axios.post(`${NH_BASE_URL}/authenticates`, null, {
    headers: {
      // IMPORTANT: raw API key (no "Bearer " prefix)
      Authorization: NH_API_KEY,
      // Required on /authenticates
      Accept: 'application/vnd.Nexhealth+json;version=2',
      'Nex-Api-Version': 'v2',
    },
    timeout: 15000,
    validateStatus: () => true,
  });

  // Typical success: { code:true, data:{ token:"<jwt>" }, ... }
  const token =
    res?.data?.data?.token ||
    res?.data?.token ||
    res?.data?.bearer ||
    res?.data?.access_token ||
    null;

  if (!token) {
    const status = res?.status;
    const body = typeof res?.data === 'object' ? JSON.stringify(res.data) : String(res?.data);
    throw new Error(`No bearer token returned from /authenticates (status ${status}): ${body}`);
  }

  bearer = token;

  // Use JWT exp if available; else ~55m
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    bearerExpiresAt = ((payload?.exp ? payload.exp * 1000 : Date.now() + 55 * 60 * 1000) - 15 * 1000);
  } catch {
    bearerExpiresAt = Date.now() + 55 * 60 * 1000;
  }
}

async function ensureBearer() {
  if (!NH_ENABLED) return;
  if (!bearer || Date.now() >= bearerExpiresAt) {
    await fetchBearer();
  }
}

// Public axios client
export const nh = axios.create({
  baseURL: NH_BASE_URL,
  timeout: 15000,
});

// Attach auth + required headers; ensure subdomain param
nh.interceptors.request.use(async (config) => {
  if (!NH_ENABLED) return config;

  await ensureBearer();

  config.headers = {
    ...(config.headers || {}),
    Authorization: `Bearer ${bearer}`,
    Accept: 'application/vnd.Nexhealth+json;version=2',
    'Content-Type': 'application/json',
  };

  config.params = { ...(config.params || {}), subdomain: config.params?.subdomain ?? SUBDOMAIN };

  return config;
});

// One-time retry on 401 by refreshing bearer
nh.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    if (NH_ENABLED && status === 401 && original && !original.__nhRetried) {
      try {
        await fetchBearer();
        original.__nhRetried = true;
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${bearer}`,
          Accept: 'application/vnd.Nexhealth+json;version=2',
          'Content-Type': 'application/json',
        };
        return nh(original);
      } catch {
        // fall through
      }
    }
    return Promise.reject(error);
  }
);

// Optional helpers (no config.js required)
export async function nhAuthenticateOnce() {
  await fetchBearer();
  return { ok: !!bearer, exp: bearerExpiresAt };
}

export async function nhSanityCheck() {
  try {
    await ensureBearer();
    const res = await nh.get('/locations', { params: { subdomain: SUBDOMAIN } });
    return { ok: true, status: res.status, count: Array.isArray(res.data) ? res.data.length : undefined };
  } catch (e) {
    return {
      ok: false,
      status: e?.response?.status || 0,
      detail: e?.response?.data || e?.message || 'Unknown error',
    };
  }
}
