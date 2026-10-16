import { useState, useEffect } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Spinner } from '../../../components/feedback/Spinner'
import { MetricCard } from './components/MetricCard'
import { StatusChart } from './components/StatusChart'
import { ProductivityTable } from './components/ProductivityTable'
import { dashboardApi } from '../../../api/dashboardApi'
import { analyticsApi } from '../../../api/analyticsApi'

/**
 * KPI section definitions for dashboard metric cards.
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

/**
 * Color mapping for status distribution chart.
 */
const statusColors = {
  REGISTERED: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  ALL_TESTS_COMPLETE: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#6b7280',
  FOR_INFORMATION: '#06b6d4',
  REJECTED: '#ef4444',
}

/**
 * Main QC Dashboard page (SRS Module 12.1).
 *
 * Displays:
 * - KPI metric cards (Inward, Execution, Quality, Alerts)
 * - Status distribution chart
 * - Analyst productivity summary
 */
export function QCDashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusData, setStatusData] = useState([])
  const [productivityData, setProductivityData] = useState([])

  useEffect(() => {
    Promise.all([
      dashboardApi.getMetrics(),
      dashboardApi.getStatusFiltering('all'),
      analyticsApi.summaryByAnalyst(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        new Date().toISOString().slice(0, 10)
      ).catch(() => null),
    ])
      .then(([metricsRes, statusRes, prodRes]) => {
        setMetrics(metricsRes.data?.data ?? metricsRes.data)

        const statusRaw = statusRes.data?.data ?? statusRes.data
        if (Array.isArray(statusRaw)) {
          setStatusData(statusRaw.map(s => ({
            ...s,
            color: statusColors[s.statusName] || '#6366f1',
          })))
        }

        const prodRaw = prodRes?.data?.data ?? prodRes?.data
        if (Array.isArray(prodRaw)) {
          setProductivityData(prodRaw.map(p => ({
            analystId: p.parameterId,
            totalTests: p.totalTests,
            completed: p.passed + p.failed,
            passed: p.passed,
            failed: p.failed,
            pending: p.pending,
            onHold: 0,
          })))
        }

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

  const m = metrics || {}

  return (
    <div>
      <PageHeader
        title="QC Dashboard"
        subtitle="Real-time Laboratory Operations Overview"
      />

      {/* KPI Metric Cards */}
      {kpiSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            {section.title}
          </h2>
          <div className={`grid gap-4 ${section.items.length === 2 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-3'}`}>
            {section.items.map((card) => (
              <MetricCard
                key={card.key}
                label={card.label}
                value={m[card.key] ?? 0}
                color={card.color}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Analytics Row: Status Chart + Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatusChart data={statusData} />
        <ProductivityTable data={productivityData.slice(0, 10)} />
      </div>
    </div>
  )
}
