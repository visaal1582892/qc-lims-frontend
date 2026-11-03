import { useEffect, useState } from 'react'
import Icon from './Icon'
import { qcRequestsApi } from '../api/qcRequests'

const STATUS_MAP = {
  I: { label: 'Initiated', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  C: { label: 'Approved', color: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  E: { label: 'Edit', color: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  T: { label: 'Replenished', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  W: { label: 'Withdraw', color: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
}

export default function TransferOrderDetailsModal({ toId, isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !toId) {
      setData(null)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    qcRequestsApi
      .getTransferOrderDetails([toId])
      .then((res) => {
        if (!isMounted) return
        const toList = res.data || []
        const found = toList.find((item) => String(item.toId) === String(toId)) || toList[0] || null
        if (!found) {
          setError(`Transfer Order #${toId} details not found.`)
        } else {
          setData(found)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.message || err.message || 'Failed to fetch Transfer Order details')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, toId])

  if (!isOpen) return null

  const statusInfo = (data && STATUS_MAP[data.status]) || {
    label: data?.statusDescription || data?.status || 'Unknown',
    color: 'bg-slate-50 text-slate-700 ring-slate-600/20',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100">
              <Icon name="truck" className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Transfer Order Details</h3>
                <span className="font-mono text-xs font-semibold text-teal-700">#{toId}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Detailed view of Transfer Order and associated replenishment items
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
              <Icon name="refreshCw" className="h-6 w-6 animate-spin text-teal-600" />
              <p className="text-xs">Loading Transfer Order details…</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Status</span>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">From Store</span>
                  <span className="mt-1 font-mono font-medium text-slate-800 block truncate" title={data.fromStoreId}>
                    {data.fromStoreId || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">To Store</span>
                  <span className="mt-1 font-mono font-medium text-slate-800 block truncate" title={data.toStoreId}>
                    {data.toStoreId || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Replenished By</span>
                  <span className="mt-1 font-medium text-slate-800 block truncate" title={data.replenishedBy}>
                    {data.replenishedBy || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Approved By</span>
                  <span className="mt-1 font-medium text-slate-700 block truncate" title={data.approvedBy}>
                    {data.approvedBy || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Date Approved</span>
                  <span className="mt-1 text-[11px] text-slate-600 block">
                    {data.dateApproved ? new Date(data.dateApproved).toLocaleDateString() : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Date Replenished</span>
                  <span className="mt-1 text-[11px] text-slate-600 block">
                    {data.dateReplenished ? new Date(data.dateReplenished).toLocaleDateString() : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Total Items</span>
                  <span className="mt-1 font-mono font-semibold text-teal-700 block">
                    {data.items ? data.items.length : 0}
                  </span>
                </div>
              </div>

              {/* Items Table Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Transfer Order Items</h4>
                  <span className="text-[10.5px] text-slate-400">
                    {data.items?.length || 0} item(s) found
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-[10.5px] font-semibold text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Batch ID</th>
                          <th className="px-3 py-2">Product ID</th>
                          <th className="px-3 py-2">Product Name</th>
                          <th className="px-3 py-2">Batch</th>
                          <th className="px-3 py-2 text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {data.items && data.items.length > 0 ? (
                          data.items.map((item, idx) => (
                            <tr key={`${item.batchId}-${idx}`} className="hover:bg-slate-50/70 transition">
                              <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                                {item.batchId || '-'}
                              </td>
                              <td className="px-3 py-2 font-mono font-medium text-slate-900">
                                {item.productId || '-'}
                              </td>
                              <td className="px-3 py-2 max-w-[200px] truncate text-slate-800" title={item.productName}>
                                {item.productName || '-'}
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                                {item.batch || '-'}
                              </td>
                              <td className="px-3 py-2 font-mono text-right font-semibold text-slate-800">
                                {item.quantity != null ? item.quantity : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                              No items recorded under this Transfer Order.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
