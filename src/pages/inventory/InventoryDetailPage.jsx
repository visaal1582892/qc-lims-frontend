/**
 * Inventory Detail Page — full record view with allocation/consumption actions.
 * Covers AC-28: Inventory detail view shows allocation/consumption.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Loader2, Save, AlertCircle, QrCode, MapPin } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Spinner } from '../../components/feedback/Spinner'
import { inventoryApi } from '../../api/inventoryApi'
import { StorageConditionBadge } from './components/StorageConditionBadge'
import { VarianceAlert } from './components/VarianceAlert'
import { StorageAllocationView } from './components/StorageAllocationView'
import { BarcodeLabelView } from './components/BarcodeLabelView'
import { formatDate } from '../../utils/formatters'

export function InventoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [showStorage, setShowStorage] = useState(false)
  const [showBarcode, setShowBarcode] = useState(false)

  // Allocation form
  const [allocQty, setAllocQty] = useState('')
  const [analystId, setAnalystId] = useState('')
  const [allocLoading, setAllocLoading] = useState(false)

  // Consumption form
  const [consumeQty, setConsumeQty] = useState('')
  const [consumeLoading, setConsumeLoading] = useState(false)

  useEffect(() => {
    loadDetail()
  }, [id])

  const loadDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inventoryApi.getById(id)
      setItem(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory detail')
    } finally {
      setLoading(false)
    }
  }

  const handleAllocate = async () => {
    if (!allocQty || !analystId) return
    setAllocLoading(true)
    try {
      await inventoryApi.allocate(id, { quantity: parseInt(allocQty), allocatedToAnalystId: parseInt(analystId) })
      setAllocQty('')
      setAnalystId('')
      loadDetail()
    } catch (err) {
      setError(err.response?.data?.message || 'Allocation failed')
    } finally {
      setAllocLoading(false)
    }
  }

  const handleConsume = async () => {
    if (!consumeQty) return
    setConsumeLoading(true)
    try {
      await inventoryApi.consume(id, { quantity: parseInt(consumeQty) })
      setConsumeQty('')
      loadDetail()
    } catch (err) {
      setError(err.response?.data?.message || 'Consumption recording failed')
    } finally {
      setConsumeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>Inventory record not found.</p>
        <button onClick={() => navigate('/inventory')} className="mt-2 text-sm text-primary-600 hover:underline">
          Back to list
        </button>
      </div>
    )
  }

  const variance = (item.quantityAllocated || 0) - (item.quantityConsumed || 0)
  const available = item.totalQuantityReceived - (item.quantityAllocated || 0)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`Inventory Detail — ${item.arNumber || 'N/A'}`}
        subtitle={`Batch: ${item.batchNo} | Product ID: ${item.productId}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBarcode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <QrCode className="h-4 w-4" />
              Barcode
            </button>
            <button
              onClick={() => setShowStorage(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <MapPin className="h-4 w-4" />
              Change Storage
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Detail Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Inventory Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">AR Number</p>
            <p className="font-medium text-slate-800">{item.arNumber || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Manufacturer ID</p>
            <p className="font-medium text-slate-800">{item.manufacturerId ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Product ID</p>
            <p className="font-medium text-slate-800">{item.productId ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Batch No</p>
            <p className="font-medium text-slate-800">{item.batchNo}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Storage Location</p>
            <div className="mt-1"><StorageConditionBadge location={item.storageLocation} /></div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">MFG Date</p>
            <p className="font-medium text-slate-800">{item.mfgDate ? formatDate(item.mfgDate) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Expiry Date</p>
            <p className="font-medium text-slate-800">{item.expDate ? formatDate(item.expDate) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Received</p>
            <p className="font-medium text-slate-800">{formatDate(item.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Quantity Tracking */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Quantity Tracking</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Total Received</p>
            <p className="text-xl font-bold text-slate-800">{item.totalQuantityReceived}</p>
          </div>
          <div className="rounded-xl bg-sky-50 p-3 text-center">
            <p className="text-xs text-sky-500">Allocated</p>
            <p className="text-xl font-bold text-sky-700">{item.quantityAllocated || 0}</p>
          </div>
          <div className="rounded-xl bg-violet-50 p-3 text-center">
            <p className="text-xs text-violet-500">Consumed</p>
            <p className="text-xl font-bold text-violet-700">{item.quantityConsumed || 0}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-xs text-emerald-500">Current Balance</p>
            <p className="text-xl font-bold text-emerald-700">{item.currentBalance ?? item.totalQuantityReceived - (item.quantityConsumed || 0)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${variance > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <p className={`text-xs ${variance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>Variance</p>
            <p className={`text-xl font-bold ${variance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{variance}</p>
          </div>
        </div>
        <div className="mt-3">
          <VarianceAlert allocated={item.quantityAllocated || 0} consumed={item.quantityConsumed || 0} />
        </div>
      </div>

      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allocate */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Allocate to Analyst</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Analyst ID <span className="text-rose-500">*</span></label>
              <input
                type="number"
                value={analystId}
                onChange={e => setAnalystId(e.target.value)}
                placeholder="Enter analyst ID"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantity <span className="text-rose-500">*</span></label>
              <input
                type="number"
                min="1"
                value={allocQty}
                onChange={e => setAllocQty(e.target.value)}
                placeholder={`Available: ${available}`}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <button
              onClick={handleAllocate}
              disabled={allocLoading || !allocQty || !analystId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              {allocLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Allocate
            </button>
          </div>
        </div>

        {/* Consume */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Record Consumption</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantity <span className="text-rose-500">*</span></label>
              <input
                type="number"
                min="1"
                value={consumeQty}
                onChange={e => setConsumeQty(e.target.value)}
                placeholder={`Available to consume: ${variance}`}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <button
              onClick={handleConsume}
              disabled={consumeLoading || !consumeQty}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              {consumeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Record Consumption
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStorage && (
        <StorageAllocationView
          inventoryId={id}
          currentLocation={item.storageLocation}
          onClose={() => setShowStorage(false)}
          onSuccess={() => loadDetail()}
        />
      )}
      {showBarcode && (
        <BarcodeLabelView
          inventoryId={id}
          onClose={() => setShowBarcode(false)}
        />
      )}
    </div>
  )
}
