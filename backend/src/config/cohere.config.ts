import { CohereClient } from 'cohere-ai';

export const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});
