/**
 * Inventory card — reusable card for inventory summary display.
 * Shows key fields + status badges.
 */
import { Box, Package, AlertTriangle } from 'lucide-react'

export function InventoryCard({ item, onClick }) {
  const variance = (item.quantityAllocated || 0) - (item.quantityConsumed || 0)

  const storageColors = {
    ambient: 'bg-amber-50 text-amber-700 ring-amber-200',
    refrigerator: 'bg-sky-50 text-sky-700 ring-sky-200',
    freezer: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    others: 'bg-slate-50 text-slate-600 ring-slate-200',
  }
  const storageKey = item.storageLocation?.toLowerCase() || 'others'

  return (
    <button
      onClick={() => onClick?.(item)}
      className="w-full text-left rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-50 p-2">
            <Package className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {item.arNumber || 'N/A'}
            </p>
            <p className="text-[11px] text-slate-500">Batch: {item.batchNo}</p>
          </div>
        </div>
        {item.storageLocation && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${storageColors[storageKey]}`}>
            {item.storageLocation}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
          <p className="text-slate-400">Total</p>
          <p className="font-semibold text-slate-700">{item.totalQuantityReceived}</p>
        </div>
        <div className="rounded-lg bg-sky-50 px-2 py-1.5 text-center">
          <p className="text-sky-400">Allocated</p>
          <p className="font-semibold text-sky-700">{item.quantityAllocated || 0}</p>
        </div>
        <div className={`rounded-lg px-2 py-1.5 text-center ${variance > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <p className={variance > 0 ? 'text-amber-400' : 'text-emerald-400'}>Balance</p>
          <p className={`font-semibold ${variance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {item.currentBalance ?? item.totalQuantityReceived - (item.quantityConsumed || 0)}
          </p>
        </div>
      </div>

      {variance > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          {variance} unit{variance > 1 ? 's' : ''} unconsumed
        </div>
      )}
    </button>
  )
}
