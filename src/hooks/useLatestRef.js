import { useRef, useEffect } from "react";

/**
 * Keeps a ref in sync with the latest value.
 * Useful for reading current state inside async callbacks without stale closures.
 * Ref is assigned in useEffect (not during render) for React Compiler compatibility.
 */
export default function useLatestRef(value) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
