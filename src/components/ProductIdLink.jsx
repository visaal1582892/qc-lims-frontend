import { useProductDetails } from '../hooks/useProductDetails'

export default function ProductIdLink({
  productId,
  className = '',
  fallback = '-',
  inactive = false,
}) {
  const { openProductDetails } = useProductDetails()
  const trimmed = productId != null ? String(productId).trim() : ''

  if (!trimmed) {
    return <span>{fallback}</span>
  }

  const colorClass = inactive
    ? 'line-through text-slate-400 hover:text-slate-600'
    : 'text-teal-700 hover:text-teal-900'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        openProductDetails(trimmed)
      }}
      title="View Product Details"
      className={`font-mono font-semibold ${colorClass} hover:underline cursor-pointer text-left ${className}`.trim()}
    >
      {trimmed}
    </button>
  )
}

