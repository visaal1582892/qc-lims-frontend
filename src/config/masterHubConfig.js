/**
 * Master hub configuration — grouped navigation for QC LIMS master data.
 *
 * Matches the marketing-automation MASTER_HUB_SECTIONS pattern.
 */

export const MASTER_HUB_SECTIONS = [
  {
    id: 'measurement-masters',
    title: 'Measurement Masters',
    description: 'Units of measurement and test parameters used in QC analysis.',
    icon: 'scale',
    accent: 'brand',
    items: [
      { label: 'Metrics',            to: '/masters/metrics',                   icon: 'scale',         right: 'ROLE_METRIC_READ' },
      { label: 'Test Parameters',    to: '/masters/test-parameters',           icon: 'flaskConical',  right: 'ROLE_TEST_PARAMETER_READ' },
    ],
  },
  {
    id: 'organization-masters',
    title: 'Organization Masters',
    description: 'Analyst qualifications and inventory configuration for QC testing.',
    icon: 'building',
    accent: 'emerald',
    items: [
      { label: 'Analyst Qualifications',    to: '/masters/analyst-qualifications', icon: 'graduationCap', right: 'ROLE_QUALIFICATION_READ' },
      { label: 'QC Inventory Configuration', to: '/masters/inventory-config',      icon: 'package2',      right: 'ROLE_INVENTORY_CONFIG_READ' },
      { label: 'Metric Specifications',     to: '/masters/metric-specifications',  icon: 'slidersHorizontal', right: 'ROLE_METRIC_SPECIFICATION_READ' },
    ],
  },
]

const ACCENT_STYLES = {
  brand:   { card: 'border-brand-200 bg-gradient-to-br from-brand-50/80 to-white', icon: 'bg-brand-100 text-brand-600', link: 'hover:border-brand-200 hover:bg-brand-50/50' },
  violet:  { card: 'border-violet-200 bg-gradient-to-br from-violet-50/80 to-white', icon: 'bg-violet-100 text-violet-600', link: 'hover:border-violet-200 hover:bg-violet-50/50' },
  slate:   { card: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white', icon: 'bg-slate-100 text-slate-600', link: 'hover:border-slate-300 hover:bg-slate-50' },
  emerald: { card: 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white', icon: 'bg-emerald-100 text-emerald-600', link: 'hover:border-emerald-200 hover:bg-emerald-50/50' },
  amber:   { card: 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white', icon: 'bg-amber-100 text-amber-600', link: 'hover:border-amber-200 hover:bg-amber-50/50' },
  sky:     { card: 'border-sky-200 bg-gradient-to-br from-sky-50/80 to-white', icon: 'bg-sky-100 text-sky-600', link: 'hover:border-sky-200 hover:bg-sky-50/50' },
}

export function getAccentStyle(accent) {
  return ACCENT_STYLES[accent] || ACCENT_STYLES.slate
}
