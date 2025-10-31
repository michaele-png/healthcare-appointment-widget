import axios from 'axios';

export const SUBDOMAIN = process.env.NH_SUBDOMAIN;       
const API_KEY = process.env.NH_API_KEY;                 
const BASE_URL = process.env.NH_BASE_URL || 'https://nexhealth.info';

export const nh = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: 'application/vnd.Nexhealth+json;version=2',
    'Content-Type': 'application/json'
  },
  timeout: 15000
});
