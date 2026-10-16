/**
 * Barcode label view — generates and displays barcode string.
 * Format: AR_Number|Product_Name|Batch_Number|Storage_Condition
 * Includes print button with print-specific CSS.
 */
import { useState } from 'react'
import { Printer, QrCode, Loader2 } from 'lucide-react'
import { inventoryApi } from '../../../api/inventoryApi'
import { Modal } from '../../../components/feedback/Modal'
import { FormInput } from '../../../components/form/FormInput'

export function BarcodeLabelView({ inventoryId, onClose }) {
  const [barcode, setBarcode] = useState(null)
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = productName.trim() ? { productName: productName.trim() } : {}
      const res = await inventoryApi.generateBarcode(inventoryId, payload)
      setBarcode(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate barcode')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = `
      <div style="text-align:center; padding:40px; font-family:monospace;">
        <h2 style="margin-bottom:20px;">QC Sample Label</h2>
        <div style="font-size:24px; letter-spacing:4px; margin:30px 0; border:2px solid #000; padding:20px;">
          ${barcode?.barcodeString || ''}
        </div>
        <div style="font-size:12px; margin-top:20px; text-align:left; max-width:300px; margin-left:auto; margin-right:auto;">
          <p>AR Number: ${barcode?.arNumber || ''}</p>
          <p>Product: ${barcode?.productName || ''}</p>
          <p>Batch: ${barcode?.batchNo || ''}</p>
          <p>Storage: ${barcode?.storageCondition || ''}</p>
        </div>
      </div>
    `
    const win = window.open('', '_blank', 'width=400,height=500')
    win.document.write(`<html><head><title>Print Barcode</title></head><body>${printContent}</body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <Modal open={!!inventoryId} onClose={onClose} title="Generate Barcode Label" size="lg">
      <div className="space-y-4">
        <FormInput
          label="Product Name"
          name="productName"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Enter product name for barcode"
          helperText="Optional — leave blank to use default"
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          Generate Barcode
        </button>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {barcode && (
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Barcode String</h3>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Label
              </button>
            </div>
            <div className="font-mono text-lg tracking-wider bg-white border border-slate-200 rounded-lg px-4 py-3 text-center">
              {barcode.barcodeString}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div><span className="font-medium text-slate-600">AR Number:</span> {barcode.arNumber}</div>
              <div><span className="font-medium text-slate-600">Product:</span> {barcode.productName || '—'}</div>
              <div><span className="font-medium text-slate-600">Batch:</span> {barcode.batchNo}</div>
              <div><span className="font-medium text-slate-600">Storage:</span> {barcode.storageCondition || '—'}</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
