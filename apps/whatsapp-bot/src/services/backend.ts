import axios from 'axios';
import { config } from '../config';

// Dedicated client: never attach the service credential to arbitrary URLs.
export const backend = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  maxRedirects: 0,
  headers: { 'x-service-token': process.env.WA_SERVICE_TOKEN || '' },
});
