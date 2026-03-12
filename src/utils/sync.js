// ── Cloud merge helper ──
// Shared logic for merging cloud data into local state.
// Used by QuotesContext.handleCloudData for both quotes and collections.

/**
 * Merge cloud items into a local array by ID, keeping the newer version
 * when both exist. Returns `prev` unchanged if nothing was modified
 * (preserves React state identity).
 *
 * @param {Array} local - current local items
 * @param {Array} cloud - incoming cloud items
 * @param {string} timestampKey - property to compare for recency ("updatedAt" or "createdAt")
 * @returns {Array} merged result, or `local` if unchanged
 */
export function mergeByTimestamp(local, cloud, timestampKey) {
  if (!cloud?.length) return local;

  const localMap = new Map(local.map(item => [item.id, item]));
  let changed = false;
  const missing = [];

  for (const cloudItem of cloud) {
    const localItem = localMap.get(cloudItem.id);
    if (!localItem) {
      missing.push(cloudItem);
      changed = true;
    } else if ((cloudItem[timestampKey] || 0) > (localItem[timestampKey] || 0)) {
      localMap.set(cloudItem.id, cloudItem);
      changed = true;
    }
  }

  if (!changed) return local;

  const updated = local.map(item => localMap.get(item.id)).filter(Boolean);
  return missing.length > 0 ? [...updated, ...missing] : updated;
}
