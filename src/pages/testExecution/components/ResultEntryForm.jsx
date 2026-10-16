/**
 * ResultEntryForm — form for submitting test results (numeric/text) + consumed units.
 * Follows UI spec Section 6.5 form input patterns.
 */
import { useState } from 'react'

export function ResultEntryForm({ execution, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    resultNumericValue: '',
    resultTextValue: '',
    consumedUnits: execution?.consumedUnits ?? 0,
    validityStatus: execution?.validityStatus ?? 'Valid',
  })
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.resultNumericValue && !form.resultTextValue) {
      setError('At least one of numeric or text result is required.')
      return
    }
    const payload = {
      ...(form.resultNumericValue !== '' ? { resultNumericValue: parseFloat(form.resultNumericValue) } : {}),
      ...(form.resultTextValue ? { resultTextValue: form.resultTextValue } : {}),
      consumedUnits: parseInt(form.consumedUnits, 10) || 0,
      validityStatus: form.validityStatus,
    }
    onSubmit(payload)
  }

  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">
          Numeric Result
        </label>
        <input
          type="number"
          step="any"
          value={form.resultNumericValue}
          onChange={(e) => setForm({ ...form, resultNumericValue: e.target.value })}
          className={inputClass}
          placeholder="e.g. 99.5"
        />
        <p className="text-[11px] text-slate-400">Enter the measured numeric value.</p>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">
          Text Result
        </label>
        <input
          type="text"
          value={form.resultTextValue}
          onChange={(e) => setForm({ ...form, resultTextValue: e.target.value })}
          className={inputClass}
          placeholder="e.g. White crystalline powder"
        />
        <p className="text-[11px] text-slate-400">For qualitative or descriptive test results.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Consumed Units
          </label>
          <input
            type="number"
            min="0"
            value={form.consumedUnits}
            onChange={(e) => setForm({ ...form, consumedUnits: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Validity Status
          </label>
          <select
            value={form.validityStatus}
            onChange={(e) => setForm({ ...form, validityStatus: e.target.value })}
            className={inputClass}
          >
            <option value="Valid">Valid</option>
            <option value="Invalid">Invalid</option>
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/30 active:scale-[0.98] transition">
          Cancel
        </button>
        <button type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition">
          Submit Result
        </button>
      </div>
    </form>
  )
}
