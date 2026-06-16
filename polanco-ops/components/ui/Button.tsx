import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:     'bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#A8893E] border border-transparent',
  secondary:   'bg-white text-[#0A0A0A] border border-[#D4D4D4] hover:bg-[#F4F4F5]',
  ghost:       'bg-transparent text-ink border border-ink/15 hover:bg-ink/5',
  destructive: 'bg-white text-[#B91C1C] border border-[#B91C1C] hover:bg-red-50',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', loading = false, disabled, className = '', children, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-inter text-sm font-medium rounded-lg px-4 min-h-[48px] transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    )
  }
)
