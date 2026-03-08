#!/usr/bin/env node
/**
 * One-time import of Quotes-500K dataset into Supabase.
 *
 * Downloads the CSV from Hugging Face (Parquet → rows API) and bulk-inserts
 * into the quotes_500k table. Run this once after creating the table via
 * supabase/migration.sql.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SECRET_KEY=xxx node scripts/import-quotes-500k.mjs
 *
 * The script processes in batches of 1000 rows via the HF Datasets API,
 * normalizes text, deduplicates, and upserts into Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aoyagemikimsycaupych.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SECRET_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HF_DATASET = 'jstet/quotes-500k';
const HF_API = 'https://datasets-server.huggingface.co/rows';
const BATCH_SIZE = 100; // HF API max per request
const UPSERT_BATCH = 500;

function normalize(text) {
  return (text || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRows(offset, length) {
  const url = `${HF_API}?dataset=${encodeURIComponent(HF_DATASET)}&config=default&split=train&offset=${offset}&length=${length}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HF API error: ${r.status} at offset ${offset}`);
  const data = await r.json();
  return data.rows || [];
}

async function upsertBatch(rows) {
  const { error } = await supabase
    .from('quotes_500k')
    .upsert(rows, { onConflict: 'normalized', ignoreDuplicates: true });
  if (error) throw error;
}

async function main() {
  console.log('Starting Quotes-500K import...');

  let offset = 0;
  let totalImported = 0;
  let buffer = [];
  const seen = new Set();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    process.stdout.write(`\rFetching offset ${offset}...`);
    let rows;
    try {
      rows = await fetchRows(offset, BATCH_SIZE);
    } catch (err) {
      console.error(`\nError at offset ${offset}: ${err.message}`);
      // Retry once after 2s
      await new Promise(r => setTimeout(r, 2000));
      try {
        rows = await fetchRows(offset, BATCH_SIZE);
      } catch {
        console.error(`\nSkipping batch at offset ${offset}`);
        offset += BATCH_SIZE;
        continue;
      }
    }

    if (!rows.length) break;

    for (const { row } of rows) {
      const quote = (row.quote || '').trim();
      const author = (row.author || '').trim();
      const category = (row.category || '').trim();
      if (!quote || quote.length < 10 || quote.length > 1000) continue;

      const norm = normalize(quote);
      if (norm.length < 8 || seen.has(norm)) continue;
      seen.add(norm);

      buffer.push({ quote, normalized: norm, author, category });

      if (buffer.length >= UPSERT_BATCH) {
        await upsertBatch(buffer);
        totalImported += buffer.length;
        process.stdout.write(`\rImported ${totalImported} rows...`);
        buffer = [];
      }
    }

    offset += BATCH_SIZE;

    // Small delay to be polite to HF API
    await new Promise(r => setTimeout(r, 100));
  }

  // Flush remaining
  if (buffer.length > 0) {
    await upsertBatch(buffer);
    totalImported += buffer.length;
  }

  console.log(`\nDone! Imported ${totalImported} quotes into quotes_500k table.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
