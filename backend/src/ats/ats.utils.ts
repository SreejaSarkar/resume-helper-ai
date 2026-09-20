const STOP_WORDS = new Set([
  'and',
  'or',
  'the',
  'a',
  'an',
  'with',
  'to',
  'for',
  'of',
  'in',
  'on',
]);

export function extractKeywords(jobDescription: string): string[] {
  const words = jobDescription
    .toLowerCase()
    .match(/\b[a-z][a-z0-9.+#-]{2,}\b/g);

  if (!words) return [];

  return [...new Set(words.filter((w) => !STOP_WORDS.has(w)))];
}

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ');
}
