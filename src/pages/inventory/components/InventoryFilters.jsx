/**
 * Filter bar for inventory search.
 */
import { Filter } from 'lucide-react'
import { FormInput } from '../../../components/form/FormInput'
import { FormSelect } from '../../../components/form/FormSelect'

export function InventoryFilters({ filters, onFilterChange }) {
  const storageOptions = [
    { value: 'Ambient', label: 'Ambient' },
    { value: 'Refrigerator', label: 'Refrigerator' },
    { value: 'Freezer', label: 'Freezer' },
    { value: 'Others', label: 'Others' },
  ]

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Filter className="h-3.5 w-3.5" />
        Filters
      </div>
      <div className="w-40">
        <FormInput
          label="AR Number"
          name="arNumber"
          value={filters.arNumber || ''}
          onChange={(e) => onFilterChange('arNumber', e.target.value)}
          placeholder="Filter..."
        />
      </div>
      <div className="w-36">
        <FormInput
          label="Batch No"
          name="batchNo"
          value={filters.batchNo || ''}
          onChange={(e) => onFilterChange('batchNo', e.target.value)}
          placeholder="Filter..."
        />
      </div>
      <div className="w-36">
        <FormSelect
          label="Storage"
          name="storageLocation"
          value={filters.storageLocation || ''}
          onChange={(e) => onFilterChange('storageLocation', e.target.value)}
          options={storageOptions}
          placeholder="All"
        />
      </div>
    </div>
  )
}
