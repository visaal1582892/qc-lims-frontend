import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Rights } from '../constants/rights'
import {
  Ruler,
  TestTube,
  CheckSquare,
  Package,
  ChevronRight,
} from 'lucide-react'

const MASTERS_SECTIONS = [
  {
    id: 'quality-masters',
    title: 'Quality Configuration',
    description: 'Metric units, test parameters, and analyst qualifications.',
    icon: '🔬',
    accent: 'brand',
    items: [
      {
        label: 'Metric Units',
        to: '/masters/metric-units',
        icon: Ruler,
        description: 'Units of measurement (mg, %, ppm, etc.)',
        readRight: Rights.ROLE_METRIC_UNIT_READ,
        uploadRight: Rights.ROLE_METRIC_UNIT_UPLOAD,
      },
      {
        label: 'Test Parameters',
        to: '/masters/test-parameters',
        icon: TestTube,
        description: 'Analytical test parameters and their result types',
        readRight: Rights.ROLE_TEST_PARAMETER_READ,
        uploadRight: Rights.ROLE_TEST_PARAMETER_UPLOAD,
      },
      {
        label: 'Analyst Qualifications',
        to: '/masters/analyst-qualifications',
        icon: CheckSquare,
        description: 'Qualifications required for analysts',
        readRight: Rights.ROLE_QUALIFICATION_READ,
        uploadRight: Rights.ROLE_QUALIFICATION_UPLOAD,
      },
    ],
  },
  {
    id: 'inventory-masters',
    title: 'Inventory & Logistics',
    description: 'Inventory configurations and QC locations.',
    icon: '📦',
    accent: 'emerald',
    items: [
      {
        label: 'QC Inventory Configuration',
        to: '/masters/inventory-config',
        icon: Package,
        description: 'Inventory tracking and configuration settings',
        readRight: Rights.ROLE_INVENTORY_CONFIG_READ,
        uploadRight: Rights.ROLE_INVENTORY_CONFIG_UPLOAD,
      },
    ],
  },
]

// Accent color mappings
const accentColors = {
  brand: {
    card: 'border-t-4 border-t-brand-500',
    header: 'bg-brand-50',
    icon: 'bg-brand-100 text-brand-600',
    link: 'hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700',
  },
  emerald: {
    card: 'border-t-4 border-t-emerald-500',
    header: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    link: 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700',
  },
  violet: {
    card: 'border-t-4 border-t-violet-500',
    header: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-600',
    link: 'hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700',
  },
  sky: {
    card: 'border-t-4 border-t-sky-500',
    header: 'bg-sky-50',
    icon: 'bg-sky-100 text-sky-600',
    link: 'hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700',
  },
}

export default function MasterHubPage() {
  const { hasRight } = useAuth()

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Master Data</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure system masters — metric units, test parameters, qualifications, and inventory settings.
        </p>
      </div>

      {/* Sections */}
      <div className="grid gap-5 lg:grid-cols-2">
        {MASTERS_SECTIONS.map(section => {
          const colors = accentColors[section.accent] || accentColors.brand
          const visibleItems = section.items.filter(item => {
            return item.readRight ? hasRight(item.readRight) : true
          })
          if (visibleItems.length === 0) return null

          return (
            <section
              key={section.id}
              className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${colors.card}`}
            >
              <div className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                  {section.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{section.description}</p>
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {visibleItems.map(item => {
                  const canUpload = item.uploadRight ? hasRight(item.uploadRight) : true
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border border-transparent rounded-lg mx-2 my-1 ${colors.link}`}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-700 truncate">{item.label}</p>
                          <p className="text-xs text-slate-400 truncate">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                          {canUpload && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-medium">Upload</span>}
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
