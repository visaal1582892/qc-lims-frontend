
/**
 * Design system form select component.
 * Same styling as FormInput for consistency.
 */
export function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  helperText,
  error,
  required,
  disabled,
  ...props
}) {
  const id = `field-${name}`

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition appearance-none
          focus:ring-2 focus:border-primary-500 focus:ring-primary-100
          disabled:bg-slate-50 disabled:text-slate-400
          ${error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  )
}
