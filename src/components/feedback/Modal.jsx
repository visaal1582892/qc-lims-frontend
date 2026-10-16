import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Accessible modal dialog component.
 * Follows UI spec Section 6.6 — backdrop, ESC dismiss, outside click dismiss.
 *
 * @param {boolean} open - Controls visibility
 * @param {function} onClose - Called on dismiss
 * @param {string} title - Modal title
 * @param {ReactNode} children - Modal body content
 * @param {ReactNode} footer - Optional footer actions
 * @param {string} size - 'sm' (max-w-sm), 'md' (max-w-lg), 'lg' (max-w-2xl), 'xl' (max-w-4xl)
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`relative w-full ${sizeClasses[size]} rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 max-h-[calc(85vh-8rem)] text-sm text-slate-600">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
