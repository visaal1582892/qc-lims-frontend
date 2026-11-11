import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'

/**
 * CustomSelect — Accessible, styled select dropdown component for forms and modals.
 * Features click-outside detection, keyboard navigation, and checkmark indicators.
 *
 * @param {object} props
 * @param {any} props.value - Currently selected value
 * @param {function} props.onChange - Selection change callback (passes value)
 * @param {Array} props.options - Array of { value, label, subLabel } or [value, label] tuples
 * @param {string} [props.placeholder='Select an option...'] - Placeholder text
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.className=''] - Additional trigger wrapper classes
 * @param {string} [props.icon] - Optional leading icon name
 * @param {boolean} [props.required=false] - Whether a selection is required
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  icon,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Normalize options to { value, label, subLabel }
  const normalizedOptions = options.map((opt) => {
    if (Array.isArray(opt)) {
      return { value: opt[0], label: opt[1], subLabel: null }
    }
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? '',
        label: opt.label ?? String(opt.value ?? ''),
        subLabel: opt.subLabel ?? null,
      }
    }
    return { value: opt, label: String(opt), subLabel: null }
  })

  // Find currently selected option
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (val) => {
    if (onChange) onChange(val)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-xs transition shadow-xs text-left focus:outline-hidden ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
            : isOpen
            ? 'border-brand-500 ring-2 ring-brand-100 text-slate-800'
            : 'border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && (
            <Icon name={icon} className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          {selectedOption ? (
            <span className="truncate font-medium text-slate-800">
              {selectedOption.label}
              {selectedOption.subLabel && (
                <span className="ml-1.5 text-slate-400 font-normal">
                  ({selectedOption.subLabel})
                </span>
              )}
            </span>
          ) : (
            <span className="truncate text-slate-400">
              {placeholder}
              {required && <span className="text-rose-500 ml-0.5">*</span>}
            </span>
          )}
        </div>
        <Icon
          name="chevronDown"
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-brand-600' : ''
          }`}
        />
      </button>

      {/* Floating Options Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100">
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-brand-50/70 text-brand-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Icon name="check" className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

