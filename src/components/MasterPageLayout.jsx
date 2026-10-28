import Icon from './Icon'

/**
 * MasterPageLayout — flex-column card that stretches to fill the available
 * page height, matching the marketing-automation frontend layout.
 *
 * The card uses flex-col so that:
 *   - Thead (sticky) stays at the top
 *   - Tbody fills the remaining space and scrolls internally
 *   - Pagination is pinned to the bottom of the card
 *
 * Props:
 *   children    – React node(s) rendered inside the card
 *   className   – additional classes on the outer wrapper
 */
export default function MasterPageLayout({ children, className = '' }) {
  return (
    <section
      className={`flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg bg-white shadow-sm
                  ring-1 ring-slate-200/70 ${className}`}
    >
      {children}
    </section>
  )
}

/**
 * MasterPageTable — wraps the <table> in a flex-1 scroll container so the
 * tbody scrolls while the thead stays sticky and pagination stays pinned.
 *
 * Props:
 *   children    – <thead> and <tbody> elements
 *   pagination  – <Pagination> JSX (rendered below the table in a border-t bar)
 */
export function MasterPageTable({ children, pagination }) {
  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden flex-1 min-h-0 overflow-auto sm:block">
        <table className="w-full min-w-full text-sm">
          {children}
        </table>
      </div>

      {/* Pagination bar — pinned at bottom */}
      {pagination && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-1">
          {pagination}
        </div>
      )}
    </>
  )
}

/* ─── Table Header Components (DRY, stationary sticky borders) ─── */

export function MasterTableHeader({ children, className = '' }) {
  return (
    <thead className={`sticky top-0 z-10 bg-slate-50 ${className}`}>
      {children}
    </thead>
  )
}

export function MasterHeaderRow({ children, className = '' }) {
  return (
    <tr
      className={`bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider
                  text-slate-500 [&>th]:bg-slate-50 [&>th]:shadow-[inset_0_-1px_0_#e2e8f0] ${className}`}
    >
      {children}
    </tr>
  )
}

export function MasterFilterRow({ children, className = '' }) {
  return (
    <tr
      className={`bg-slate-50 [&>th]:bg-slate-50 [&>th]:shadow-[inset_0_-1px_0_#e2e8f0] ${className}`}
    >
      {children}
    </tr>
  )
}

/* ─── Filter Controls ─── */

export function FilterInput({ value, onChange, placeholder, icon }) {
  return (
    <div className="relative">
      {icon && (
        <Icon name={icon}
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-slate-200 bg-white py-1.5
                    text-xs text-slate-700 shadow-sm placeholder:text-slate-400
                    focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100
                    ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`}
      />
    </div>
  )
}

export function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-2.5 pr-7
                 text-xs text-slate-700 shadow-sm appearance-none cursor-pointer
                 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100
                 bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path fill=%22%2394a3b8%22 d=%22M6 8L1 3h10z%22/></svg>')] bg-[right_0.5rem_center] bg-no-repeat"
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  )
}

export function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium
                  ${active
                    ? 'bg-accent-50 text-accent-700 ring-1 ring-accent-200'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-accent-500' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function TableStatusRow({ colSpan, children, className = '' }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={`bg-white py-14 text-center text-slate-500 ${className}`}
      >
        {children}
      </td>
    </tr>
  )
}
