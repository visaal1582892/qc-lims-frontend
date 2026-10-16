import { useState, useCallback } from 'react'

/**
 * Headless custom hook for async data fetching.
 * Follows architecture Pattern C.
 *
 * @param {Function} fetchFn - Async function to execute
 * @param {Array} dependencies - Dependencies to trigger re-fetch
 */
export function useAsyncData(fetchFn) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  })

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetchFn()
      setState((prev) => ({ ...prev, data: response.data ?? response, loading: false }))
    } catch (err) {
      setState((prev) => ({ ...prev, error: err, loading: false }))
    }
  }, [fetchFn])

  // Initial fetch
  if (state.loading && state.data === null) {
    refetch()
  }

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  }
}
