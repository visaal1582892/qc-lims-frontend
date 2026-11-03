import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { qcRequestsApi } from '../api/qcRequests'
import Icon from '../components/Icon'

const SAMPLE_PAYLOAD = {
  grnId: '3917933',
  storeId: 'INAPHYD00384',
  batchDetails: [
    {
      productId: 'DULO0103',
      productName: 'MI-DULOXEMP 30MG TAB',
      manufacturer: 'PURE AND CURE HEALTHCARE PVT LTD',
      batchId: '1167111111',
      batch: 'W1',
      expiryDate: '2029-12-31',
      quantity: 999,
      packSize: 1,
      barcode: '1131171980',
    },
    {
      productId: 'ROCK0053',
      productName: 'ROCK WOOL',
      manufacturer: 'NON TRADE DEFAULT MANUFACTURER',
      batchId: '116722222',
      batch: 'W2',
      expiryDate: '2029-12-31',
      quantity: 999,
      packSize: 1,
      barcode: '1131171981',
    },
  ],
}

export default function PayloadInwardPage() {
  const navigate = useNavigate()
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE_PAYLOAD, null, 2))
  const [loading, setLoading] = useState(false)
  const [syntaxError, setSyntaxError] = useState(null)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState(null)

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(jsonText)
      setJsonText(JSON.stringify(parsed, null, 2))
      setSyntaxError(null)
    } catch (err) {
      setSyntaxError('Invalid JSON format: ' + err.message)
    }
  }

  const handleLoadSample = () => {
    setJsonText(JSON.stringify(SAMPLE_PAYLOAD, null, 2))
    setSyntaxError(null)
    setResult(null)
    setApiError(null)
  }

  const handleClear = () => {
    setJsonText('')
    setSyntaxError(null)
    setResult(null)
    setApiError(null)
  }

  const handleSubmit = async () => {
    setSyntaxError(null)
    setApiError(null)
    setResult(null)

    if (!jsonText.trim()) {
      setSyntaxError('Please enter a JSON payload.')
      return
    }

    let parsedPayload
    try {
      parsedPayload = JSON.parse(jsonText)
    } catch (err) {
      setSyntaxError('Invalid JSON: ' + err.message)
      return
    }

    setLoading(true)
    try {
      const res = await qcRequestsApi.submitInwardPayload(parsedPayload)
      setResult(res.data)
    } catch (err) {
      console.error('Inward submission error:', err)
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Submission failed'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-4">
      {/* Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
            <Icon name="fileText" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Payload Inward</h1>
            <p className="text-xs text-slate-500">
              Paste raw JSON payload to generate QC testing requests and update GRN inward records.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon name="copy" className="h-3.5 w-3.5" />
            Load Sample
          </button>
          <button
            type="button"
            onClick={handlePrettify}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon name="code" className="h-3.5 w-3.5" />
            Format JSON
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]"
          >
            <Icon name="trash2" className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing…
              </>
            ) : (
              <>
                <Icon name="upload" className="h-3.5 w-3.5" />
                Submit Inward Payload
              </>
            )}
          </button>
        </div>
      </header>

      {/* Result Banners */}
      {result && (
        <div className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Icon name="check" className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">{result.message}</p>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-emerald-800">
                  <span>GRN ID: <strong className="font-mono">{result.grnId}</strong></span>
                  <span>Total Batches: <strong>{result.totalReceived}</strong></span>
                  <span>New Created: <strong className="text-emerald-700">{result.newCreated}</strong></span>
                  {result.skippedDuplicates > 0 && (
                    <span className="text-amber-800">Duplicates Skipped: <strong>{result.skippedDuplicates}</strong></span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/qc-requests')}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800"
            >
              <Icon name="clipboardList" className="h-3.5 w-3.5" />
              View in Pending QC Requests
            </button>
          </div>
        </div>
      )}

      {apiError && (
        <div className="shrink-0 rounded-lg border border-rose-200 bg-rose-50/90 p-3.5 text-sm text-rose-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="alertCircle" className="h-4 w-4 shrink-0 text-rose-600" />
            <strong className="font-semibold">Submission Error:</strong> {apiError}
          </div>
        </div>
      )}

      {syntaxError && (
        <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="alertTriangle" className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="font-medium">{syntaxError}</span>
          </div>
        </div>
      )}

      {/* Main Large Text Area */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 text-xs font-medium text-slate-500">
          <span className="font-mono">JSON Inward Editor</span>
          <span className="text-[11px] text-slate-400">Ctrl+Enter to format</span>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value)
            if (syntaxError) setSyntaxError(null)
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handlePrettify()
            }
          }}
          placeholder="Paste or type raw JSON payload here..."
          className="h-full w-full flex-1 resize-none p-4 font-mono text-xs leading-relaxed text-slate-800 outline-none focus:ring-1 focus:ring-brand-500/50 bg-slate-900 text-slate-100"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
