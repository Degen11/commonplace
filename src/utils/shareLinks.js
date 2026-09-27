import { PUBLIC_HASH_PREFIX, PUBLIC_SHARE_PATH } from "../config";

const SHARE_PATH_RE = /^\/c\/([a-z0-9]{4,20})\/?$/;

// The public share ID in the current URL: /c/<id> (current links, which get
// server-rendered meta tags from api/share-page.js) or #p=<id> (older links).
export function getPublicShareId(loc = window.location) {
  const pathMatch = loc.pathname.match(SHARE_PATH_RE);
  if (pathMatch) return pathMatch[1];
  const hash = loc.hash.slice(1);
  if (!hash.startsWith(PUBLIC_HASH_PREFIX)) return null;
  const id = hash.slice(PUBLIC_HASH_PREFIX.length);
  return id.length >= 4 && id.length <= 20 ? id : null;
}

export function isPublicSharePath(loc = window.location) {
  return loc.pathname.startsWith(PUBLIC_SHARE_PATH);
}

export function publicShareUrl(id) {
  return `${window.location.origin}${PUBLIC_SHARE_PATH}${id}`;
}

// Web Share API, used on touch devices so links and images open the phone's own
// share sheet. Desktop keeps the clipboard/download flows: desktop share sheets
// are unfamiliar and would hide the "copied!" behavior people expect there.
export function canNativeShare(data) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (!window.matchMedia?.("(pointer: coarse)").matches) return false;
  return !data || typeof navigator.canShare !== "function" || navigator.canShare(data);
}

// Resolves "shared", or "cancelled" when the user closes the sheet. Other errors
// reject, e.g. NotAllowedError when Safari decides the tap that started an async
// step (share-link fetch, image render) is too old, so callers can fall back.
export async function nativeShare(data) {
  try {
    await navigator.share(data);
    return "shared";
  } catch (err) {
    if (err?.name === "AbortError") return "cancelled";
    throw err;
  }
}
