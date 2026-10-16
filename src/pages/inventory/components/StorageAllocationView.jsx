/**
 * Storage allocation view — assign physical storage location to an inventory record.
 * Shows current storage overview grid by condition.
 */
import { useState, useEffect } from 'react'
import { Box, Save, Loader2, Thermometer } from 'lucide-react'
import { inventoryApi } from '../../../api/inventoryApi'
import { Modal } from '../../../components/feedback/Modal'
import { FormSelect } from '../../../components/form/FormSelect'
import { getTemperatureRange } from '../../../utils/formatters'

const STORAGE_OPTIONS = [
  { value: 'Ambient', label: 'Ambient (Room temp)' },
  { value: 'Refrigerator', label: 'Refrigerator (2-8°C)' },
  { value: 'Freezer', label: 'Freezer (-23 to -13°C)' },
  { value: 'Others', label: 'Others' },
]

const STORAGE_COLORS = {
  Ambient: 'bg-amber-50 text-amber-700 ring-amber-200',
  Refrigerator: 'bg-sky-50 text-sky-700 ring-sky-200',
  Freezer: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Others: 'bg-slate-50 text-slate-600 ring-slate-200',
}

export function StorageAllocationView({ inventoryId, currentLocation, onClose, onSuccess }) {
  const [selectedLocation, setSelectedLocation] = useState(currentLocation || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (selectedLocation) {
      loadCounts(selectedLocation)
    }
  }, [selectedLocation])

  const loadCounts = async (location) => {
    try {
      const res = await inventoryApi.getByStorage(location)
      setCounts(prev => ({ ...prev, [location]: res.data.data?.length || 0 }))
    } catch {
      // Non-critical — counts display only
    }
  }

  const handleSave = async () => {
    if (!selectedLocation) return
    setSaving(true)
    setError(null)
    try {
      await inventoryApi.assignStorage(inventoryId, selectedLocation)
      onSuccess?.(selectedLocation)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign storage')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!inventoryId} onClose={onClose} title="Assign Storage Location" size="md">
      <div className="space-y-4">
        <FormSelect
          label="Storage Condition"
          name="storageLocation"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          options={STORAGE_OPTIONS}
          placeholder="Select storage condition..."
          required
        />

        {selectedLocation && (
          <div className={`rounded-lg px-3 py-2 text-xs ring-1 ring-inset ${STORAGE_COLORS[selectedLocation] || STORAGE_COLORS.Others}`}>
            <div className="flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5" />
              {getTemperatureRange(selectedLocation)}
            </div>
            {counts[selectedLocation] != null && (
              <div className="flex items-center gap-1.5 mt-1">
                <Box className="h-3.5 w-3.5" />
                {counts[selectedLocation]} sample{counts[selectedLocation] !== 1 ? 's' : ''} in this location
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedLocation}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Assign Storage
          </button>
        </div>
      </div>
    </Modal>
  )
}
