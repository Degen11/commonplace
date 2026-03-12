import { z } from 'zod';

// ── Shared primitives ──

const stripHtml = s => s.replace(/<[^>]*>/g, '').trim();
const confidence = z.enum(['high', 'medium', 'low']);

export const uuidV4 = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  'Invalid device_id',
);

// ── /api/identify ──

export const identifySchema = z.object({
  messages: z.array(
    z.object({
      role: z.literal('user'),
      content: z.string().min(1).max(10000, 'Input too large. Send fewer quotes per batch.'),
    }),
  ).min(1).max(1),
  formatting: z.boolean().optional(),
});

// ── /api/sync POST ──

const quoteSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(10000),
  source: z.string().max(500).optional().default('Unknown'),
  category: z.string().max(100).optional().default('Unknown'),
  confidence: confidence.optional().default('low'),
  favorite: z.boolean().optional().default(false),
  updatedAt: z.number().positive().optional(),
}).passthrough();

// Filter-style array: silently drops invalid items (matches original behavior)
const quotesArray = z.preprocess(
  val => (Array.isArray(val) ? val : []),
  z.array(z.any()).max(50000, 'Too many quotes'),
).transform(arr =>
  arr.reduce((acc, item) => {
    const result = quoteSchema.safeParse(item);
    if (result.success) acc.push(result.data);
    return acc;
  }, []),
);

const deletedIdEntry = z.object({
  id: z.string(),
  deletedAt: z.number().optional(),
});

const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough();

export const syncPostSchema = z.object({
  device_id: uuidV4,
  quotes: quotesArray,
  customCategories: z.array(
    z.string().min(1).max(50).transform(stripHtml),
  ).max(200).optional().default([]),
  deletedIds: z.array(deletedIdEntry).optional().default([]),
  collections: z.array(collectionSchema).max(500).optional().default([]),
});

// ── /api/share POST ──

// Compact tuple: [text, source, category, fav?]
const shareQuoteTuple = z.tuple([
  z.string().min(1).max(5000),   // text
  z.string().max(500),            // source
  z.string().max(100),            // category
]).rest(z.any()).transform(([text, source, category, fav]) => [
  stripHtml(text), stripHtml(source), stripHtml(category), fav === 1 ? 1 : 0,
]);

// Filter-style: silently drops invalid tuples (matches original behavior)
const shareQuotesArray = z.preprocess(
  val => (Array.isArray(val) ? val : []),
  z.array(z.any()).max(10000, 'Too many quotes (max 10000)'),
).transform(arr =>
  arr.reduce((acc, item) => {
    const result = shareQuoteTuple.safeParse(item);
    if (result.success) acc.push(result.data);
    return acc;
  }, []),
);

export const sharePostSchema = z.object({
  quotes: shareQuotesArray,
  title: z.string().max(100).transform(stripHtml).optional().nullable(),
});

// ── /api/share GET ──

export const shareGetSchema = z.object({
  id: z.string().min(4).max(20, 'Invalid share ID'),
});

// ── /api/auto-group ──

export const autoGroupSchema = z.object({
  theme: z.string().min(1).max(200, 'Invalid theme (string, max 200 chars)'),
  quotes: z.array(z.string()).min(1).max(500, 'Invalid quotes array (1-500 items)'),
});

// ── /api/fetch-url ──

export const fetchUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
  extractMode: z.enum(['all', 'quotes', 'main', 'headings']).optional().default('all'),
});

// ── /api/cache ──

const cacheItem = z.object({
  text: z.string().min(1),
  source: z.string().min(1),
  category: z.string().optional(),
  confidence: confidence.optional(),
});

export const cacheSchema = z.object({
  items: z.array(cacheItem).min(1).max(20, 'Invalid items array (1-20)'),
});

// ── /api/lookup ──

const lookupQuote = z.object({
  text: z.string().min(1),
  hint: z.string().optional().nullable(),
});

export const lookupSchema = z.object({
  quotes: z.array(lookupQuote).min(1).max(20, 'Invalid quotes array (1-20 items)'),
});

// ── Helper: validate and extract first Zod error message ──

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.errors[0];
    return { ok: false, error: first.message };
  }
  return { ok: true, data: result.data };
}
