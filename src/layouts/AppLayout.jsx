import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

/**
 * AppLayout — replicates the marketing-automation frontend sidebar & header.
 *
 * - Hover-based sidebar expansion (white sidebar, 72px collapsed → 256px expanded)
 * - Section headers with labels when expanded, dividers when collapsed
 * - Inline tooltips on hover in collapsed mode
 * - Profile dropdown with gradient avatar
 * - Active link indicator (left bar + gradient bg)
 * - Sign-out button in sidebar footer with collapsed tooltip
 * - Single "Masters" nav link → opens MasterHubPage (no sub-navigation)
 */

const OVERVIEW_NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'layoutDashboard' },
]

const ADMIN_NAV_LINKS = [
  { to: '/masters', label: 'Masters', icon: 'cog', rights: ['ROLE_MASTER_DATA_READ', 'ROLE_MASTER_DATA_CREATE', 'ROLE_MASTER_DATA_UPDATE', 'ROLE_MASTER_DATA_DELETE', 'ROLE_METRIC_UNIT_READ', 'ROLE_TEST_PARAMETER_READ', 'ROLE_QUALIFICATION_READ', 'ROLE_INVENTORY_CONFIG_READ'] },
]

export default function AppLayout() {
  const { user, logout, hasRight } = useAuth()
  const location = useLocation()

  const [hovered, setHovered]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const profileMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const collapsed    = !(hovered || mobileOpen)
  const sidebarWidth = (hovered || mobileOpen) ? 'w-64' : 'w-[72px]'
  const padded       = hovered ? 'lg:pl-64' : 'lg:pl-[72px]'

  // Filter nav links by user rights
  const visibleOverview = useMemo(() => OVERVIEW_NAV_LINKS, [])
  const visibleAdmin = useMemo(() => {
    return ADMIN_NAV_LINKS.filter((item) => {
      if (!item.rights) return true
      return hasRight('ROLE_SYSTEM_ADMIN') || item.rights.some((r) => hasRight(r))
    })
  }, [hasRight])

  // Determine header title from route
  const navHeader = useMemo(() => {
    if (location.pathname === '/masters') return 'Master Hub'
    if (location.pathname === '/dashboard') return 'Dashboard'
    if (location.pathname.startsWith('/masters/')) return 'Master Data'
    return 'QC LIMS'
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* ============ SIDEBAR ============ */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed inset-y-0 left-0 z-[40] ${sidebarWidth} flex flex-col
                    overflow-hidden border-r border-slate-200/80 bg-white
                    transition-all duration-200 ease-in-out
                    ${hovered ? 'shadow-2xl shadow-slate-900/5' : ''}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand row */}
        <div className={`flex h-[60px] shrink-0 items-center border-b border-slate-100/80 bg-white
                         ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50/50 transition hover:bg-brand-50">
              <Logo size={28} />
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2.5">
              <Logo size={30} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-bold tracking-tight text-slate-900">MedPlus</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-block rounded bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-brand-600 border border-brand-100/80 leading-none">
                    QC LIMS
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-hidden overflow-y-auto py-2.5 ${collapsed ? 'px-2 space-y-2' : 'px-2.5 space-y-3'}`}>
          {/* Section 1: Overview */}
          {visibleOverview.length > 0 && (
            <div className="space-y-0.5">
              {visibleOverview.map(item => (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed}
                />
              ))}
            </div>
          )}

          {/* Section 2: Masters */}
          {visibleAdmin.length > 0 && (
            <div>
              {!collapsed ? (
                <div className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  Masters
                </div>
              ) : (
                <div className="my-1.5 mx-2 border-t border-slate-200/80" />
              )}
              <div className="space-y-0.5">
                {visibleAdmin.map(item => (
                  <SidebarLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer: sign out */}
        <div className="shrink-0 border-t border-slate-100 p-2 bg-slate-50/40">
          <button
            onClick={() => logout()}
            className={`group relative flex w-full items-center rounded-xl text-slate-500 transition-all duration-150 hover:bg-rose-50 hover:text-rose-600 ${
              collapsed
                ? 'mx-auto h-9 w-9 justify-center'
                : 'px-3 py-2 text-xs font-medium gap-2.5'
            }`}
          >
            <Icon name="logOut" className="h-[18px] w-[18px] shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="font-medium">Sign out</span>}
            {collapsed && (
              <div className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover:flex items-center">
                <div className="relative rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl whitespace-nowrap animate-in fade-in duration-100">
                  Sign out
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ============ MAIN COLUMN ============ */}
      <div className={`flex h-screen flex-col transition-[padding] duration-200 ${padded}`}>
        {/* Header */}
        <header className="sticky top-0 z-[50] flex h-[60px] items-center justify-between
                           border-b border-slate-100 bg-white/95 px-4 backdrop-blur-sm
                           shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <h1 className="truncate text-sm font-semibold tracking-tight text-slate-700">
              {navHeader}
            </h1>
          </div>

          {/* Profile dropdown */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              onClick={() => setProfileOpen((m) => !m)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5
                         text-left transition hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full
                              bg-gradient-to-br from-brand-500 to-brand-700 text-xs
                              font-semibold text-white shadow-sm ring-2 ring-white">
                {(user?.fullName || user?.employeeId || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium leading-tight text-slate-800">
                  {user?.fullName || user?.employeeId}
                </div>
                <div className="text-xs leading-tight text-slate-500">
                  {user?.roles?.[0] || 'User'}
                </div>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-[60] mt-2 w-60 overflow-hidden rounded-xl
                              border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                  bg-gradient-to-br from-brand-500 to-brand-700 text-xs
                                  font-semibold text-white shadow-sm">
                    {(user?.fullName || user?.employeeId || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">
                      {user?.fullName || user?.employeeId}
                    </div>
                    <div className="truncate text-xs text-slate-500">{user?.employeeId}</div>
                  </div>
                </div>
                {user?.roles && user.roles.length > 0 && (
                  <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-1.5 py-0.5
                                     text-xs font-medium text-brand-700 ring-1 ring-brand-100">
                      {user.roles[0]}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => { setProfileOpen(false); logout() }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm
                             text-slate-700 transition hover:bg-slate-50 border-t border-slate-100"
                >
                  <Icon name="logOut" className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex flex-1 min-h-0 flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* Sidebar primitives (from marketing-automation)                     */
/* ----------------------------------------------------------------- */

function SidebarLink({ to, label, icon, collapsed }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `group relative flex items-center transition-all duration-150 select-none ${
          collapsed
            ? 'mx-auto justify-center h-9 w-9 rounded-xl my-0.5'
            : 'rounded-lg my-0.5 px-3 py-2 text-[13.5px] font-medium'
        } ${
          isActive
            ? collapsed
              ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200/80 shadow-xs'
              : 'bg-gradient-to-r from-brand-50 to-brand-50/20 text-brand-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator line in expanded mode */}
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 shadow-xs" />
          )}

          {/* Icon */}
          <span
            className={`relative flex items-center justify-center shrink-0 transition-transform duration-150 ${
              isActive
                ? 'text-brand-600'
                : 'text-slate-500 group-hover:text-slate-800 group-hover:scale-110'
            }`}
          >
            <Icon
              name={icon}
              className={collapsed ? 'h-[18px] w-[18px]' : 'h-[17.5px] w-[17.5px]'}
            />
          </span>

          {/* Label in expanded mode */}
          {!collapsed && (
            <span className="ml-2.5 truncate flex-1 tracking-tight">{label}</span>
          )}

          {/* Tooltip in collapsed mode */}
          {collapsed && (
            <div className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover:flex items-center">
              <div className="relative rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl whitespace-nowrap animate-in fade-in duration-100">
                {label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}
