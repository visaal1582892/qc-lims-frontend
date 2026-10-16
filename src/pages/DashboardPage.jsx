import { useState, useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Spinner } from '../components/feedback/Spinner'
import { dashboardApi } from '../api/dashboardApi'

/**
 * Dashboard KPI card definitions with color coding.
 */
const kpiSections = [
  {
    title: 'Inward Requests',
    items: [
      { key: 'pendingFeasibility', label: 'Pending Feasibility', color: 'amber' },
      { key: 'accepted', label: 'Accepted', color: 'green' },
      { key: 'rejected', label: 'Rejected', color: 'red' },
    ],
  },
  {
    title: 'Active Execution',
    items: [
      { key: 'testing', label: 'Testing', color: 'blue' },
      { key: 'onHold', label: 'On Hold', color: 'amber' },
      { key: 'underReview', label: 'Under Review', color: 'purple' },
    ],
  },
  {
    title: 'Quality Outcomes',
    items: [
      { key: 'released', label: 'Released', color: 'green' },
      { key: 'qualityRejected', label: 'Quality Rejected', color: 'red' },
      { key: 'qualityOnHold', label: 'Quality On Hold', color: 'amber' },
    ],
  },
  {
    title: 'Alerts',
    items: [
      { key: 'activeOosIncidents', label: 'Active OOS Incidents', color: 'red' },
      { key: 'activeReworkCases', label: 'Active Rework Cases', color: 'orange' },
    ],
  },
]

const colorMap = {
  amber: 'from-amber-400 to-amber-600',
  green: 'from-emerald-400 to-emerald-600',
  red: 'from-red-400 to-red-600',
  blue: 'from-blue-400 to-blue-600',
  purple: 'from-violet-400 to-violet-600',
  orange: 'from-orange-400 to-orange-600',
}

/**
 * Dashboard page — real KPI data from backend (SRS Module 12.1).
 *
 * Fetches metrics on mount, displays sectioned KPI card grid.
 */
export function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    dashboardApi.getMetrics()
      .then((res) => {
        const data = res.data?.data ?? res.data
        setMetrics(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="QC Laboratory Information Management System" />
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-sm font-medium text-red-500">Error loading dashboard</p>
          <p className="text-[11px] text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Default fallback if metrics is null/undefined
  const m = metrics || {}

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="QC Laboratory Information Management System"
      />

      {/* Sectioned KPI Grid */}
      {kpiSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            {section.title}
          </h2>
          <div className={`grid gap-4 ${section.items.length === 2 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-3'}`}>
            {section.items.map((card) => (
              <div
                key={card.key}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-900/8"
              >
                <div className="flex items-start justify-between">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[card.color] || 'from-slate-400 to-slate-600'} text-white shadow-sm`}>
                    <span className="text-sm font-bold">{m[card.key] ?? 0}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                    {m[card.key] ?? 0}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-400">{card.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
