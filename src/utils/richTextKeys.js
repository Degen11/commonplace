// Handles Cmd/Ctrl+B, I, U in textareas to wrap selected text with markdown markers.
// Returns true if the event was handled (caller should preventDefault).
export function handleRichTextShortcut(e, value, setValue) {
  if (!(e.metaKey || e.ctrlKey)) return false;

  const markers = { b: "**", i: "*", u: "__" };
  const marker = markers[e.key.toLowerCase()];
  if (!marker) return false;

  e.preventDefault();
  const el = e.target;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.slice(start, end);

  // If selection is already wrapped with this marker, unwrap it
  const before = value.slice(Math.max(0, start - marker.length), start);
  const after = value.slice(end, end + marker.length);
  if (before === marker && after === marker) {
    const newValue = value.slice(0, start - marker.length) + selected + value.slice(end + marker.length);
    setValue(newValue);
    requestAnimationFrame(() => {
      el.selectionStart = start - marker.length;
      el.selectionEnd = end - marker.length;
    });
    return true;
  }

  // Wrap selection (or insert empty markers at cursor)
  const wrapped = marker + selected + marker;
  const newValue = value.slice(0, start) + wrapped + value.slice(end);
  setValue(newValue);
  requestAnimationFrame(() => {
    if (selected) {
      // Keep the text selected (inside the markers)
      el.selectionStart = start + marker.length;
      el.selectionEnd = end + marker.length;
    } else {
      // Place cursor between the markers
      el.selectionStart = el.selectionEnd = start + marker.length;
    }
  });
  return true;
}
