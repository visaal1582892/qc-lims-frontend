import { PageHeader } from '../components/layout/PageHeader'
import { Spinner } from '../components/feedback/Spinner'

/**
 * Dashboard placeholder page.
 * Displays KPI card grid as a starting point.
 */
export function DashboardPage() {
  const kpiCards = [
    { label: 'Total Samples', value: 0, sub: 'This month' },
    { label: 'Pending Tests', value: 0, sub: 'Awaiting allocation' },
    { label: 'OOS Incidents', value: 0, sub: 'Open this quarter' },
    { label: 'Completed', value: 0, sub: 'Released this month' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="QC Laboratory Information Management System"
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-900/8"
          >
            <div className="flex items-start justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
                <span className="text-sm font-bold">{card.value}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold tracking-tight text-slate-900 leading-none">{card.value}</div>
              <div className="mt-1 text-xs font-medium text-slate-400">{card.label}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder content area */}
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-slate-300 mb-4">
          <Spinner size="lg" />
        </div>
        <p className="text-sm font-medium text-slate-400">No data available</p>
        <p className="text-[11px] text-slate-400 mt-1">Feature modules will populate this dashboard</p>
      </div>
    </div>
  )
}
