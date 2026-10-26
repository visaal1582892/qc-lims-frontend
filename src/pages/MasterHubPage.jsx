import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { masterHubConfig } from '../config/masterHubConfig'
import Icon from '../components/Icon'

export default function MasterHubPage() {
  const { hasRight } = useAuth()
  const navigate = useNavigate()

  const visibleMasters = masterHubConfig.filter(
    (m) => !m.requiredRight || hasRight(m.requiredRight)
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                           bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon name="cog" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Master Hub</h1>
            <p className="text-xs text-slate-500">
              Configure and manage all master data for the QC LIMS system.
            </p>
          </div>
        </div>
      </header>

      {/* Cards Grid */}
      {visibleMasters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleMasters.map((master) => (
            <button
              key={master.path}
              onClick={() => navigate(master.path)}
              className={`
                group flex flex-col p-5 bg-white rounded-xl border-2 text-left
                ${master.borderColor} ${master.hoverBorderColor}
                hover:shadow-md transition-all duration-200
              `}
            >
              {/* Icon */}
              <div
                className={`
                  flex items-center justify-center h-11 w-11 rounded-lg mb-3
                  ${master.bgColor}
                `}
              >
                <Icon name={master.icon} className={`h-6 w-6 ${master.color}`} />
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
                {master.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                {master.description}
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Manage
                <Icon name="chevronRight" className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {visibleMasters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="lock" className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-base font-medium text-slate-600">No Access</h3>
          <p className="text-sm text-slate-400 mt-1">
            You don't have permission to view any master data.
          </p>
        </div>
      )}
    </div>
  )
}
