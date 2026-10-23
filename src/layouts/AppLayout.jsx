import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../auth/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Masters', to: '/masters', icon: Settings },
]

export default function AppLayout() {
  const { user, logout, hasRight } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-slate-100">
          <Logo />
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
              || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-brand-50 text-brand-600 border-r-2 border-brand-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
                <ChevronRight className="h-3.5 w-3.5 ml-auto text-slate-300" />
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.employeeId}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-2 py-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-slate-800">
            QC LIMS
          </h1>
        </header>

        {/* Page content — child routes render here */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
