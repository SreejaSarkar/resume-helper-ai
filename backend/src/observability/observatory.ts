import { Observatory } from '@sreejasarkar/api-observatory';

const observatoryApiKey =
  process.env.OBSERVATORY_API_KEY || '01783afa-330f-4070-bb28-3b7b7a5ece92';

export const observatory = new Observatory({
  apiKey: observatoryApiKey,
  serverUrl:
    process.env.OBSERVATORY_SERVER_URL ||
    process.env.OBSERVATORY_URL ||
    'http://localhost:3001',
  environment: process.env.NODE_ENV || 'development',
  batchSize: 10,
  flushInterval: 5000,
  timeout: 5000,
  maxRetries: 3,
  maxQueueSize: 1000,
  debug: process.env.NODE_ENV !== 'production',
});
