import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { navConfig } from '../constants/navConfig'
import { useAuth } from '../auth/authContext'

/**
 * Application shell layout with collapsible mini-sidebar.
 *
 * Per UI spec Section 5.1-5.2:
 * - Resting width: 72px (icons centered, labels hidden)
 * - Hover width: 256px (w-64)
 * - Zero content shift: main content fixed offset
 */
export function AppLayout({ children }) {
  const [sidebarHover, setSidebarHover] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  const menuItems = navConfig

  // Shared menu item renderer — accepts `collapsed` to switch between icon-only and full row
  const renderMenuItems = (collapsed) =>
    menuItems.map((item) => {
      const Icon = item.icon
      const isActive = location.pathname === item.path

      return collapsed ? (
        <NavLink
          key={item.path}
          to={item.path}
          className={`group relative flex items-center justify-center w-full h-10 rounded-lg transition-colors ${
            isActive ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Icon className="h-5 w-5" />
          {/* Hover tooltip when collapsed */}
          {!sidebarHover && (
            <div className="absolute left-full ml-3 z-50 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              {item.label}
            </div>
          )}
        </NavLink>
      ) : (
        <NavLink
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-primary-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      )
    })

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar — always 72px base, overlay on hover */}
      <aside
        className="fixed top-0 left-0 z-sidebar h-screen bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col"
        style={{ width: '72px' }}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
        {/* Brand */}
        <div className="flex h-[60px] items-center justify-center border-b border-slate-700/50">
          <span className="text-lg font-bold tracking-tight">QC</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {renderMenuItems(true)}
        </nav>

        {/* User pill at bottom */}
        <div className="border-t border-slate-700/50 p-3">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
          </div>
        </div>

        {/* Expand overlay on hover */}
        {sidebarHover && (
          <div className="absolute top-0 left-[72px] w-64 h-screen bg-slate-900 border-r border-slate-700/50 shadow-xl z-sidebar flex flex-col">
            <div className="h-[60px] flex items-center px-5 border-b border-slate-700/50">
              <span className="text-sm font-semibold text-slate-400">QC LIMS</span>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {renderMenuItems(false)}
            </nav>
          </div>
        )}
      </aside>

      {/* Main content — fixed 72px left offset */}
      <div className="flex-1 flex flex-col pl-[72px]">
        {/* Sticky header */}
        <header className="sticky top-0 z-header h-[60px] bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-700">
              {menuItems.find((i) => i.path === location.pathname)?.label || 'QC LIMS'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
              <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <span className="text-xs font-medium text-slate-600">{user?.name ?? 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
