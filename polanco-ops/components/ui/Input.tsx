import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, id, className = '', ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="font-inter text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-lg border bg-base px-4 py-3 font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:border-navy ${
            error ? 'border-danger' : 'border-ink/15'
          } ${className}`}
          {...props}
        />
        {error && <p className="font-inter text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
