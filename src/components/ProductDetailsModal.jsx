import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { productsApi } from '../api/products'

function formatProductStatus(status, statusCode) {
  const normalized = String(status || statusCode || '').trim().toUpperCase()
  if (normalized === 'A' || normalized === 'ACTIVE') {
    return {
      label: 'ACTIVE',
      badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      dotClass: 'bg-emerald-500',
    }
  }
  if (normalized === 'I' || normalized === 'INACTIVE') {
    return {
      label: 'INACTIVE',
      badgeClass: 'bg-rose-50 text-rose-700 ring-rose-600/20',
      dotClass: 'bg-rose-500',
    }
  }
  return {
    label: status || statusCode || '-',
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-600/20',
    dotClass: 'bg-slate-400',
  }
}

export default function ProductDetailsModal({ productId, isOpen, openNonce = 0, onClose }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [resolvedKey, setResolvedKey] = useState(null)
  const activeRequestRef = useRef(0)

  const handleClose = useCallback(() => {
    activeRequestRef.current += 1
    setData(null)
    setError(null)
    setLoading(false)
    setResolvedKey(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, handleClose])

  const currentRequestKey = `${productId || ''}:${openNonce}`

  useEffect(() => {
    if (!isOpen || !productId) return undefined

    const reqId = ++activeRequestRef.current
    const requestKey = `${productId}:${openNonce}`
    let isMounted = true

    Promise.resolve()
      .then(() => {
        if (!isMounted || activeRequestRef.current !== reqId) return null
        setData(null)
        setError(null)
        setResolvedKey(null)
        setLoading(true)
        return productsApi.getProductDetails(productId)
      })
      .then((res) => {
        if (!res || !isMounted || activeRequestRef.current !== reqId) return
        setData(res.data)
        setResolvedKey(requestKey)
      })
      .catch((err) => {
        if (!isMounted || activeRequestRef.current !== reqId) return
        setError(err.response?.data?.message || err.message || 'Failed to fetch product details')
        setResolvedKey(requestKey)
      })
      .finally(() => {
        if (isMounted && activeRequestRef.current === reqId) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
      activeRequestRef.current += 1
    }
  }, [isOpen, productId, openNonce])

  if (!isOpen) return null

  const showLoading = loading || resolvedKey !== currentRequestKey || (!data && !error)
  const statusInfo = data ? formatProductStatus(data.status, data.statusCode) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-modal-title"
      onClick={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <Icon name="package" className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="product-details-modal-title" className="text-sm font-bold text-slate-900">
                  Product Details
                </h3>
                {productId && (
                  <span className="font-mono text-xs font-semibold text-teal-700">#{productId}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Master product catalog &amp; manufacturer overview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close product details modal"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {showLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
              <Icon name="refreshCw" className="h-6 w-6 animate-spin text-teal-600" />
              <p className="text-xs">Loading product details…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-start gap-2.5">
              <Icon name="alertCircle" className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load product details</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 text-xs">
              <div>
                <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">
                  Product ID
                </span>
                <span className="mt-1 font-mono text-sm font-semibold text-slate-900 block">
                  {data.productId || productId || '-'}
                </span>
              </div>

              <div>
                <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">
                  Status
                </span>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusInfo.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                  {statusInfo.label}
                </span>
              </div>

              <div className="sm:col-span-2 border-t border-slate-200/70 pt-3">
                <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">
                  Product Name
                </span>
                <span className="mt-1 font-semibold text-slate-900 block break-words leading-snug">
                  {data.productName || '-'}
                </span>
              </div>

              <div className="sm:col-span-2 border-t border-slate-200/70 pt-3">
                <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">
                  Manufacturer Name
                </span>
                <span className="mt-1 font-medium text-slate-800 block break-words leading-snug">
                  {data.manufacturerName || '-'}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-300 ring-inset hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
