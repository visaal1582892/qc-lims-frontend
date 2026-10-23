import { useState, useMemo } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { masterHubConfig } from '../config/masterHubConfig'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  MoreVertical,
} from 'lucide-react'

export default function AppLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mastersOpen, setMastersOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)

  const navItems = useMemo(() => [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'layoutDashboard',
    },
    {
      label: 'Masters',
      icon: 'database',
      children: masterHubConfig,
    },
  ], [])

  return (
    <div className="flex h-screen bg-slate-50/80 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-[#1e2130] border-r border-slate-700/30
          transition-[width] duration-300 ease-in-out
          ${collapsed ? 'w-[70px]' : 'w-[240px]'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-slate-700/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              <Logo tone="light" />
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-white truncate">
                QC LIMS
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            if (!item.children) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-600/15 text-brand-500'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                  onClick={() => {
                    if (collapsed) setCollapsed(false)
                  }}
                >
                  <Icon name={item.icon} className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )
            }

            // Parent with children (Masters)
            const parentActive = item.children.some(
              (child) => location.pathname === child.path
            )
            const parentMatch = location.pathname === `/${item.label.toLowerCase()}`

            return (
              <div key={item.label}>
                <button
                  onClick={() => setMastersOpen(!mastersOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    parentActive || parentMatch
                      ? 'bg-brand-600/15 text-brand-500'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon name={item.icon} className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 flex-shrink-0 transition-transform ${
                          mastersOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </>
                  )}
                </button>

                {/* Sub items */}
                {mastersOpen && !collapsed && (
                  <div className="mt-1 space-y-1 pl-9">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-brand-600/15 text-brand-500 font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`
                        }
                      >
                        <Icon name={child.icon} className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{child.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Collapse button */}
        <div className="flex items-center border-t border-slate-700/30">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin-left] duration-300 ease-in-out ${
          collapsed ? 'ml-[70px]' : 'ml-[240px]'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm">
          {/* Left — Breadcrumb / Title */}
          <div className="flex items-center min-w-0">
            <h2 className="text-base font-semibold text-slate-800 truncate">
              {pageTitle(location.pathname)}
            </h2>
          </div>

          {/* Right — Profile */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.employeeId?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700 leading-tight">
                    {user?.fullName || user?.employeeId || 'User'}
                  </span>
                  <span className="text-xs text-slate-400 leading-tight">
                    {user?.roles?.[0] || 'User'}
                  </span>
                </div>
                <MoreVertical className="h-4 w-4 text-slate-400" />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-40">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {user?.fullName || user?.employeeId}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user?.employeeId}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function pageTitle(pathname) {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/masters') return 'Master Hub'

  const page = masterHubConfig.find((c) => c.path === pathname)
  if (page) return page.title

  return 'QC LIMS'
}
