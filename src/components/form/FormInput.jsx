import { useState } from 'react'

/**
 * Design system form input component.
 * Follows UI spec Section 6.5 styling.
 */
export function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
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
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition
            focus:ring-2 focus:border-primary-500 focus:ring-primary-100
            disabled:bg-slate-50 disabled:text-slate-400
            ${error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'}`}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[11px] text-rose-600">{error}</p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  )
}
