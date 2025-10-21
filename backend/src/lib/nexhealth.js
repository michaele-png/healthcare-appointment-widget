import axios from 'axios';

export const SUBDOMAIN = process.env.NEXHEALTH_SUBDOMAIN;

export const nh = axios.create({
  baseURL: process.env.NEXHEALTH_API_BASE,  // sandbox or prod
  headers: {
    Authorization: `Bearer ${process.env.NEXHEALTH_API_KEY}`,
    Accept: 'application/vnd.Nexhealth+json;version=20240412',
    'Content-Type': 'application/json'
  },
  timeout: 10000
});
