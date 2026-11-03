import { useEffect, useState } from 'react'
import Icon from './Icon'
import { qcRequestsApi } from '../api/qcRequests'

export default function GrnDetailsModal({ grnId, isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !grnId) {
      setData(null)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    qcRequestsApi
      .getGrnDetails([grnId])
      .then((res) => {
        if (!isMounted) return
        const grnList = res.data || []
        const found = grnList.find((item) => String(item.proformaStoreReceiptId) === String(grnId)) || grnList[0] || null
        if (!found) {
          setError(`GRN #${grnId} details not found.`)
        } else {
          setData(found)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.message || err.message || 'Failed to fetch GRN details')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, grnId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Icon name="package" className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">GRN Details</h3>
                <span className="font-mono text-xs font-semibold text-indigo-700">#{grnId}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Detailed view of Goods Receipt Note and associated line items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Icon name="refreshCw" className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-xs">Loading GRN details…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-start gap-2.5">
              <Icon name="alertCircle" className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load details</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Header Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">GRN Receipt ID</span>
                  <span className="mt-1 font-mono font-semibold text-slate-900 block truncate">
                    {data.proformaStoreReceiptId || grnId}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-600/20">
                    {data.statusDescription || data.status || 'Active'}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Total Items</span>
                  <span className="mt-1 font-semibold text-slate-800 block">
                    {data.items?.length || 0} product line(s)
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    GRN Items ({data.items?.length || 0})
                  </h4>
                </div>

                {!data.items || data.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    No items recorded under this GRN.
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-50 text-[10.5px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2">Product ID</th>
                            <th className="px-3 py-2">Product Name</th>
                            <th className="px-3 py-2">Batch ID</th>
                            <th className="px-3 py-2">Batch</th>
                            <th className="px-3 py-2 text-right">Quantity</th>
                            <th className="px-3 py-2">Expiry Date</th>
                            <th className="px-3 py-2">Pack Size</th>
                            <th className="px-3 py-2">Barcode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {data.items.map((item, idx) => (
                            <tr key={`${item.productId}-${item.batchId}-${idx}`} className="hover:bg-slate-50/80 transition">
                              <td className="px-3 py-2 font-mono text-slate-700 font-medium">{item.productId || '-'}</td>
                              <td className="px-3 py-2 font-medium text-slate-900 max-w-[180px] truncate" title={item.productName}>
                                {item.productName || '-'}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600">{item.batchId || '-'}</td>
                              <td className="px-3 py-2 font-mono text-slate-800 font-semibold">{item.batch || '-'}</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                                {item.quantity != null ? item.quantity.toLocaleString() : '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{item.dateExpiry || '-'}</td>
                              <td className="px-3 py-2 text-slate-600">{item.packSize || '-'}</td>
                              <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{item.barcode || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-300 ring-inset hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
