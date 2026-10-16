import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

/**
 * Floating notification toast component.
 * Bottom-right stack, auto-dismiss after duration.
 * Follows UI spec Section 6.7.
 *
 * @param {string} message - Toast message
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration - Auto-dismiss duration in ms (default 4000)
 * @param {function} onClose - Called on dismiss
 */
export function Toast({ message, type = 'info', duration = 4000, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    info: <Info className="h-5 w-5 text-slate-500 shrink-0" />,
  }

  const styles = {
    success: 'bg-emerald-50/95 text-emerald-950 ring-emerald-200/70 shadow-emerald-900/5',
    error: 'bg-rose-50/95 text-rose-950 ring-rose-200/70 shadow-rose-900/5',
    info: 'bg-white/95 text-slate-800 ring-slate-200/70 shadow-slate-900/5',
  }

  return (
    <div className={`pointer-events-auto w-[340px] rounded-2xl p-4 shadow-xl ring-1 backdrop-blur-md transition-all duration-300 ${styles[type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }} className="text-slate-400 hover:text-slate-600 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Toast container — manages a stack of toasts.
 * Call addToast({ message, type }) to push.
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}
