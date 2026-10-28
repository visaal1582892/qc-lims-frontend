import { Link } from 'react-router-dom'
import Icon from '../Icon'

export default function BackToMaster({ to = '/masters', className = '' }) {
  return (
    <Link
      to={to}
      className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500
                  transition hover:text-brand-600 ${className}`}
    >
      <Icon name="chevronLeft" className="h-3.5 w-3.5" />
      Back to Master Hub
    </Link>
  )
}
