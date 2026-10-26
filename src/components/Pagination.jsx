import Icon from './Icon'

/**
 * Reusable pagination bar — matches marketing-automation frontend.
 *
 * Props:
 *   page          number   – current 0-based page index
 *   totalPages    number   – total number of pages
 *   totalElements number   – total record count (for display)
 *   pageSize      number   – rows per page
 *   onPageChange  fn(page) – called with new 0-based page when user navigates
 *   onPageSizeChange  fn(size) – called when user picks a new page size
 *   loading       bool     – when true, nav buttons are disabled
 */
export default function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
}) {
  if (totalElements === 0) return null

  const from       = page * pageSize + 1
  const to         = Math.min((page + 1) * pageSize, totalElements)
  const multiPage  = totalPages > 1
  const pages      = multiPage ? buildPageWindow(page, totalPages) : []

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
      {/* Record range — always visible */}
      <span className="text-xs text-slate-500">
        {from}–{to} of {totalElements} record{totalElements !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-3">
        {/* Rows per page selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            disabled={loading}
            className="rounded-md border border-slate-200 bg-white py-0.5 pr-6
                       text-xs font-medium text-slate-700 shadow-sm appearance-none cursor-pointer
                       focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-100
                       bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22 viewBox=%220 0 10 10%22><path fill=%22%2394a3b8%22 d=%22M5 7L1 3h8z%22/></svg>')] bg-[right_0.35rem_center] bg-no-repeat"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Navigation — only when there are multiple pages */}
        {multiPage && (
          <div className="flex items-center gap-1">
            <NavBtn
              disabled={page === 0 || loading}
              onClick={() => onPageChange(0)}
              title="First page"
            >
              <Icon name="chevronsUpDown" className="h-3.5 w-3.5 rotate-90" />
            </NavBtn>

            <NavBtn
              disabled={page === 0 || loading}
              onClick={() => onPageChange(page - 1)}
              title="Previous page"
            >
              <Icon name="chevronLeft" className="h-3.5 w-3.5" />
            </NavBtn>

            {pages.map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400 select-none">…</span>
              ) : (
                <button
                  key={p}
                  disabled={loading}
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] rounded-md px-1.5 py-1 text-xs font-medium transition
                    ${p === page
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 disabled:opacity-50'}`}
                >
                  {p + 1}
                </button>
              )
            )}

            <NavBtn
              disabled={page >= totalPages - 1 || loading}
              onClick={() => onPageChange(page + 1)}
              title="Next page"
            >
              <Icon name="chevronRight" className="h-3.5 w-3.5" />
            </NavBtn>

            <NavBtn
              disabled={page >= totalPages - 1 || loading}
              onClick={() => onPageChange(totalPages - 1)}
              title="Last page"
            >
              <Icon name="chevronsUpDown" className="h-3.5 w-3.5 -rotate-90" />
            </NavBtn>
          </div>
        )}
      </div>
    </div>
  )
}

function NavBtn({ disabled, onClick, title, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-md p-1.5 text-slate-500
                 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  )
}

/** Returns an array of page indices + '…' ellipsis markers. */
function buildPageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)

  const pages = []
  // Always show first page
  pages.push(0)

  if (current > 2) pages.push('…')

  const lo = Math.max(1, current - 1)
  const hi = Math.min(total - 2, current + 1)
  for (let i = lo; i <= hi; i++) pages.push(i)

  if (current < total - 3) pages.push('…')

  // Always show last page
  pages.push(total - 1)

  return pages
}
