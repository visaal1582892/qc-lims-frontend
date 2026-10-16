import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { useAuthRights } from '../../../auth/useAuthRights'
import { Rights } from '../../../constants/rights'

/**
 * Feature-specific action menu for Test Parameter rows.
 *
 * Dropdown with Edit and Delete actions, gated by rights.
 * Tier 2 sub-component (colocated per architecture rule).
 */
export function TestParameterActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const { hasRight } = useAuthRights()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        aria-label="Row actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-100">
          {hasRight(Rights.ROLE_TEST_PARAMETER_UPDATE) && (
            <button
              onClick={() => { onEdit(row); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-400" />
              Edit
            </button>
          )}

          {hasRight(Rights.ROLE_TEST_PARAMETER_DELETE) && (
            <button
              onClick={() => { onDelete(row); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              Delete
            </button>
          )}

          {!hasRight(Rights.ROLE_TEST_PARAMETER_UPDATE) && !hasRight(Rights.ROLE_TEST_PARAMETER_DELETE) && (
            <div className="px-3 py-2 text-xs text-slate-400 italic">No actions</div>
          )}
        </div>
      )}
    </div>
  )
}
