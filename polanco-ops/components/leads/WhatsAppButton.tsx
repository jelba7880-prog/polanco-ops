import { MessageCircle } from 'lucide-react'
import { normalizeNigerianPhone } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  phone: string
  message?: string
  className?: string
}

export function WhatsAppButton({ phone, message, className }: WhatsAppButtonProps) {
  const digits = normalizeNigerianPhone(phone).replace('+', '')
  const url = `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-inter text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] bg-gold text-on-accent hover:bg-gold/90',
        className
      )}
    >
      <MessageCircle size={16} />
      Message on WhatsApp
    </a>
  )
}
