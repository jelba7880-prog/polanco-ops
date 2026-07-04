'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { formatUSD, formatNGN, usdToNgn } from '@/lib/formatters'
import type { ExtraItem } from '@/lib/validations/deal.schema'

interface ExtrasBuilderProps {
  extras: ExtraItem[]
  exchangeRate: number
  onChange: (extras: ExtraItem[]) => void
}

export function ExtrasBuilder({ extras, exchangeRate, onChange }: ExtrasBuilderProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    const amount = parseFloat(newAmount)
    if (!newLabel.trim()) {
      setError('Label is required')
      return
    }
    if (!newAmount || isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    onChange([...extras, { label: newLabel.trim(), amount_usd: amount }])
    setNewLabel('')
    setNewAmount('')
  }

  function handleRemove(index: number) {
    onChange(extras.filter((_, i) => i !== index))
  }

  const totalExtras = extras.reduce((sum, e) => sum + e.amount_usd, 0)

  return (
    <div>
      <p className="font-inter text-xs font-medium text-ink-muted mb-3">EXTRAS & ADD-ONS</p>

      {/* Existing extras */}
      {extras.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {extras.map((extra, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 bg-base rounded-xl border border-[var(--border)]"
            >
              <div>
                <p className="font-inter text-sm text-ink">{extra.label}</p>
                <p className="font-inter text-xs text-ink-muted tabular-nums">
                  {formatUSD(extra.amount_usd)} · {formatNGN(usdToNgn(extra.amount_usd, exchangeRate))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="p-2 text-ink-muted hover:text-danger transition-all duration-150 ease-out active:scale-[0.97]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {/* Extras subtotal */}
          <div className="flex justify-between px-4 py-2">
            <span className="font-inter text-xs text-ink-muted">Extras subtotal</span>
            <span className="font-inter text-xs font-medium text-ink tabular-nums">
              {formatUSD(totalExtras)}
            </span>
          </div>
        </div>
      )}

      {/* Add new extra */}
      <div className="flex flex-col gap-2 p-4 bg-surface-muted rounded-xl border border-[var(--border)]">
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="e.g. Tinting"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="text-sm"
          />
          <Input
            placeholder="Amount (USD)"
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="text-sm"
          />
        </div>
        {error && <p className="text-xs text-danger font-inter">{error}</p>}
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-sm font-inter text-navy hover:opacity-80 transition-all duration-150 ease-out active:scale-[0.97]"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>
    </div>
  )
}
