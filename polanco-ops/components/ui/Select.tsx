import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, id, className = '', children, ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="font-inter text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`w-full appearance-none rounded-lg border bg-base px-4 py-3 font-inter text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:border-navy ${
            error ? 'border-danger' : 'border-ink/15'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="font-inter text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
