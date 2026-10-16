import { useState, useEffect, useCallback } from 'react'

/**
 * Headless custom hook for async data fetching.
 * Follows architecture Pattern C.
 *
 * @param {Function} fetchFn - Async function to execute
 * @param {Array} dependencies - Dependencies to trigger re-fetch
 */
export function useAsyncData(fetchFn, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelled, setCancelled] = useState(false)

  const execute = useCallback(async () => {
    setCancelled(false)
    setLoading(true)
    setError(null)
    try {
      const response = await fetchFn()
      if (!cancelled) {
        setData(response.data ?? response)
      }
    } catch (err) {
      if (!cancelled) {
        setError(err)
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }, [fetchFn])

  useEffect(() => {
    execute()
    // Cleanup: flag stale state updates on unmount or dependency change
    return () => setCancelled(true)
  }, [...dependencies])

  return { data, loading, error, refetch: execute }
}
