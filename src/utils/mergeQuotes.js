// Merge quotes by ID: union both sets, keep newer version for conflicts.
// Shared between client (useSync) and server (api/sync.js).
export function mergeQuotes(localQuotes, cloudQuotes, deletedIds) {
  const merged = new Map();

  for (const q of cloudQuotes) {
    if (q && q.id) merged.set(q.id, q);
  }

  for (const q of localQuotes) {
    if (!q || !q.id) continue;
    const existing = merged.get(q.id);
    if (!existing || (q.updatedAt || 0) >= (existing.updatedAt || 0)) {
      merged.set(q.id, q);
    }
  }

  if (Array.isArray(deletedIds)) {
    for (const entry of deletedIds) {
      if (!entry || typeof entry.id !== "string") continue;
      const deletedAt = typeof entry.deletedAt === "number" ? entry.deletedAt : 0;
      const existing = merged.get(entry.id);
      if (existing && deletedAt >= (existing.updatedAt || 0)) {
        merged.delete(entry.id);
      }
    }
  }

  return Array.from(merged.values());
}
