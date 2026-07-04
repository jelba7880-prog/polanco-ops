'use client'

import { cn } from '@/lib/utils'
import { toDisplayCase } from '@/lib/formatters'

interface PublicFilterChipsProps {
  makes: string[]
  bodyTypes: string[]
  selectedMake: string | null
  selectedBodyType: string | null
  onMakeChange: (make: string | null) => void
  onBodyTypeChange: (bodyType: string | null) => void
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 inline-flex items-center h-8 px-4 rounded-full font-inter text-[13px] border transition-colors duration-150 ease-out',
        active
          ? 'bg-ink text-white border-ink'
          : 'bg-white text-ink-soft border-[var(--border)]'
      )}
    >
      {label}
    </button>
  )
}

export function PublicFilterChips({
  makes,
  bodyTypes,
  selectedMake,
  selectedBodyType,
  onMakeChange,
  onBodyTypeChange,
}: PublicFilterChipsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-inter text-[11px] text-ink-muted uppercase tracking-wide mb-2">
          Make
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap">
          <Chip label="All" active={selectedMake === null} onClick={() => onMakeChange(null)} />
          {makes.map((make) => (
            <Chip
              key={make}
              label={make}
              active={selectedMake === make}
              onClick={() => onMakeChange(make)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="font-inter text-[11px] text-ink-muted uppercase tracking-wide mb-2">
          Body Type
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap">
          <Chip
            label="All"
            active={selectedBodyType === null}
            onClick={() => onBodyTypeChange(null)}
          />
          {bodyTypes.map((bodyType) => (
            <Chip
              key={bodyType}
              label={toDisplayCase(bodyType)}
              active={selectedBodyType === bodyType}
              onClick={() => onBodyTypeChange(bodyType)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
