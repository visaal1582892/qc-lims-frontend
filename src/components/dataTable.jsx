/**
 * Shared layout helpers for full-width scrollable data tables.
 */

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
