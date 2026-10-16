/**
 * Test execution table columns for the DataTable.
 * Imported by TestExecutionPage to keep it under the 350-line limit.
 */
import { ExecutionStatusBadge } from './ExecutionStatusBadge'
import { ComplianceBadge } from './ComplianceBadge'
import { StatusTransitionControls } from './StatusTransitionControls'
import { formatDate, formatDecimal } from '../../../utils/formatters'

export function buildExecutionColumns(onAction) {
  return [
    { key: 'arNumber', label: 'AR Number', width: '140px' },
    { key: 'parameterName', label: 'Parameter', width: '160px' },
    {
      key: 'allocatedToAnalystId',
      label: 'Analyst',
      width: '80px',
      render: (val) => val ? `ID ${val}` : '-',
    },
    {
      key: 'executionStatus',
      label: 'Status',
      width: '130px',
      render: (val) => <ExecutionStatusBadge status={val} />,
    },
    {
      key: 'complianceFlag',
      label: 'Compliance',
      width: '90px',
      render: (val) => <ComplianceBadge flag={val} />,
    },
    {
      key: 'resultNumericValue',
      label: 'Result',
      width: '100px',
      render: (val, row) => val != null ? formatDecimal(val) : (row.resultTextValue ? truncate(row.resultTextValue, 12) : '-'),
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '120px',
      render: (val) => formatDate(val),
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      width: '120px',
      render: (val) => val ? formatDate(val) : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '220px',
      stickyRight: true,
      render: (_, row) => <StatusTransitionControls execution={row} onAction={onAction} />,
    },
  ]
}

function truncate(str, maxLen) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}
