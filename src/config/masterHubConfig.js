/**
 * Master hub configuration — data-driven navigation.
 */
export const masterHubConfig = [
  {
    title: 'Metric Units',
    description: 'Manage measurement units used in test results (mg, %, ppm, count, etc.)',
    icon: 'scale',
    path: '/masters/metric-units',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    hoverBorderColor: 'hover:border-brand-400',
    requiredRight: 'ROLE_METRIC_UNIT_READ',
  },
  {
    title: 'Test Parameters',
    description: 'Manage analytical test parameters, result types, and associated metric units.',
    icon: 'flaskConical',
    path: '/masters/test-parameters',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBorderColor: 'hover:border-blue-400',
    requiredRight: 'ROLE_TEST_PARAMETER_READ',
  },
  {
    title: 'Analyst Qualifications',
    description: 'Manage analyst-to-parameter qualifications with qualification dates.',
    icon: 'graduationCap',
    path: '/masters/analyst-qualifications',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hoverBorderColor: 'hover:border-emerald-400',
    requiredRight: 'ROLE_QUALIFICATION_READ',
  },
  {
    title: 'QC Inventory Configuration',
    description: 'Manage product-to-parameter inventory requirements and counts.',
    icon: 'package2',
    path: '/masters/inventory-config',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBorderColor: 'hover:border-amber-400',
    requiredRight: 'ROLE_INVENTORY_CONFIG_READ',
  },
]
