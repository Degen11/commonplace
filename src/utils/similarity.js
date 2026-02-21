import { normalize } from "./parsing";

function wordSet(s) {
  return new Set(normalize(s).split(" ").filter(w => w.length > 2));
}

export function similarity(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wa = wordSet(a), wb = wordSet(b);
  if (!wa.size || !wb.size) return 0;
  let overlap = 0;
  wa.forEach(w => { if (wb.has(w)) overlap++; });
  return (overlap * 2) / (wa.size + wb.size);
}
