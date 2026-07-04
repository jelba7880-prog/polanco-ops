import Link from 'next/link'
import { Phone } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const WHATSAPP_NUMBER = '+234 911 564 8723'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-base border-b border-[var(--border)]">
      <div className="mx-auto max-w-[1280px] h-16 md:h-[72px] px-4 md:px-10 flex items-center justify-between">
        <Link href="/cars">
          <p className="font-display font-bold tracking-widest text-ink text-lg leading-tight">
            POLANCO
          </p>
          <p className="font-inter text-[10px] text-ink-muted uppercase tracking-wide">
            Exotic Cars · Lagos
          </p>
        </Link>

        <div className="flex items-center gap-1">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-inter text-sm text-ink-soft hover:text-ink transition-colors duration-150 ease-out"
          >
            <Phone size={18} />
            <span className="hidden sm:inline">{WHATSAPP_NUMBER}</span>
          </a>

          {/* Showcase gets the quick icon toggle only — anonymous visitors have
              no Settings surface, so no full Light/Dark/System picker here. */}
          <ThemeToggle className="ml-1" />
        </div>
      </div>
    </header>
  )
}
