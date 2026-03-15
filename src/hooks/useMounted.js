import { useRef, useEffect, useCallback } from "react";

/**
 * Track whether the component is still mounted.
 * Use the returned ref to guard state updates in async callbacks.
 *
 * @returns {React.MutableRefObject<boolean>}
 */
export default function useMounted() {
  const ref = useRef(true);
  useEffect(() => () => { ref.current = false; }, []);
  return ref;
}

/**
 * Wrap a dispatch (or any setter) so it only fires while mounted.
 * Replaces the repeated pattern of `if (mountedRef.current) dispatch(action)`.
 *
 * @param {function} dispatch
 * @returns {function}
 */
export function useSafeDispatch(dispatch) {
  const mounted = useMounted();
  return useCallback(
    (action) => { if (mounted.current) dispatch(action); },
    [dispatch, mounted],
  );
}
