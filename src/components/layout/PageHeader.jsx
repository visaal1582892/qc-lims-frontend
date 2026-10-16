import { Plus } from 'lucide-react'

/**
 * Page header component — title + action buttons area.
 *
 * @param {string} title
 * @param {string} subtitle
 * @param {Array|ReactNode} actions — Array of { label, onClick, icon, variant? } or JSX elements
 */
export function PageHeader({ title, subtitle, actions }) {
  const renderActions = () => {
    if (!actions) return null

    // If actions is an array of action objects, render them as buttons
    if (Array.isArray(actions)) {
      return actions.map((action, i) => {
        // If it's already a React element, render it directly
        if (action && typeof action === 'object' && action.type) {
          return action
        }

        // Render action object as a button
        const Icon = action.icon || Plus
        const variantClasses = {
          primary: 'bg-primary-600 text-white hover:bg-primary-700',
          success: 'bg-emerald-600 text-white hover:bg-emerald-700',
          danger: 'bg-rose-600 text-white hover:bg-rose-700',
          default: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
        }
        const bg = variantClasses[action.variant] || variantClasses.default

        return (
          <button
            key={i}
            type="button"
            onClick={action.onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${bg}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </button>
        )
      })
    }

    // Fallback: render as-is (JSX node)
    return actions
  }

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {renderActions()}
        </div>
      )}
    </div>
  )
}
