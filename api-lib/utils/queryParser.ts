import { STOP_WORDS } from './serviceCatalog.js';

export interface ParsedQuery {
  search?: string;
  categoryId?: number;
  city?: string;
  experience?: number;
  rating?: number;
  maxBudget?: number;
  verifiedOnly?: boolean;
}

const CITIES = ['hyderabad', 'bangalore', 'bengaluru', 'chennai', 'mumbai', 'delhi', 'pune', 'kolkata'];
const CITY_LABEL: Record<string, string> = { bengaluru: 'Bangalore' };

/** Neighbourhood → parent city. */
const LOCALITIES: Record<string, string> = {
  gachibowli: 'Hyderabad',
  madhapur: 'Hyderabad',
  'jubilee hills': 'Hyderabad',
  'banjara hills': 'Hyderabad',
  kondapur: 'Hyderabad',
  'hitech city': 'Hyderabad',
  whitefield: 'Bangalore',
  koramangala: 'Bangalore',
  indiranagar: 'Bangalore',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (phrase: string) => new RegExp(`(^|[^a-z0-9])${escape(phrase)}(?=$|[^a-z0-9])`, 'i');
const title = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

/**
 * Parses a natural-language search into structured filters.
 * Works on whole words only — it never removes letters from inside words.
 * Ex: "Need an architect for a villa in Hyderabad" → { search: "architect villa", city: "Hyderabad" }
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const parsed: ParsedQuery = {};
  let rest = ` ${query} `;
  const lower = query.toLowerCase();

  // 1. Location: a city name, else a known locality (mapped to its city). Removed from the search text.
  const city = CITIES.find((c) => wordRe(c).test(lower));
  if (city) {
    parsed.city = CITY_LABEL[city] ?? title(city);
    rest = rest.replace(new RegExp(wordRe(city).source, 'gi'), '$1');
  } else {
    const locality = Object.keys(LOCALITIES).find((l) => wordRe(l).test(lower));
    if (locality) {
      parsed.city = LOCALITIES[locality];
      rest = rest.replace(new RegExp(wordRe(locality).source, 'gi'), '$1');
    }
  }

  // 2. Experience: "5 years", "10+ yrs"
  const exp = lower.match(/(\d+)\s*\+?\s*(?:years?|yrs?)\b/);
  if (exp) {
    parsed.experience = parseInt(exp[1], 10);
    rest = rest.replace(/(\d+)\s*\+?\s*(?:years?|yrs?)\b/gi, ' ');
  }

  // 3. Budget: "under 10 lakh", "below ₹500000"
  const lakh = lower.match(/(?:under|below|less than)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l)\b/);
  const amount = lower.match(/(?:under|below|less than)\s*(?:rs\.?|₹|inr)?\s*(\d+)\b/);
  if (lakh) parsed.maxBudget = parseFloat(lakh[1]) * 100000;
  else if (amount) parsed.maxBudget = parseInt(amount[1], 10);
  if (lakh || amount) rest = rest.replace(/(?:under|below|less than)\s*(?:rs\.?|₹|inr)?\s*\d+(?:\.\d+)?\s*(?:lakhs?|lacs?|l\b)?/gi, ' ');

  // 4. Verification intent
  if (/\b(verified|certified|approved)\b/.test(lower)) parsed.verifiedOnly = true;

  // 5. Remaining keywords: drop whole-word stop words and bare numbers, keep original spelling/case.
  const words = rest
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w));
  const cleaned = words.join(' ');
  if (cleaned.length >= 2) parsed.search = cleaned;

  return parsed;
}
