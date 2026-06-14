'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  dealSchema,
  type DealFormInput,
  type DealFormValues,
} from '@/lib/validations/deal.schema'
import { useCars } from '@/hooks/useCars'
import { useLead } from '@/hooks/useLeads'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useSettings } from '@/hooks/useSettings'
import { ExtrasBuilder } from '@/components/deals/ExtrasBuilder'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { formatUSD, formatNGN, usdToNgn } from '@/lib/formatters'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3

export default function NewDealPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId')

  const { data: cars } = useCars()
  const { data: lead } = useLead(leadId ?? '')
  const { data: exchangeRateData } = useExchangeRate()
  const { data: settings } = useSettings()

  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [useManualCar, setUseManualCar] = useState(false)

  const exchangeRate = exchangeRateData?.rate ?? settings?.exchange_rate_usd_ngn ?? 1580

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<DealFormInput, unknown, DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      extras: [],
      exchange_rate: exchangeRate,
      valid_hours: 48,
      lead_id: leadId ?? undefined,
    },
  })

  // Pre-fill from lead
  useEffect(() => {
    if (lead) {
      setValue('client_name', lead.name)
      if (lead.car_id) setValue('car_id', lead.car_id)
    }
  }, [lead, setValue])

  // Update exchange rate when loaded
  useEffect(() => {
    if (exchangeRate) setValue('exchange_rate', exchangeRate)
  }, [exchangeRate, setValue])

  const watchedCarId = watch('car_id')
  const watchedPriceUsd = watch('price_usd') ?? 0
  const watchedExtras = watch('extras') ?? []
  const watchedExchangeRate = watch('exchange_rate') ?? exchangeRate

  const selectedCar = cars?.find((c) => c.id === watchedCarId)

  // Auto-fill price when car is selected
  useEffect(() => {
    if (selectedCar) {
      setValue('price_usd', selectedCar.price_usd)
    }
  }, [selectedCar, setValue])

  const extrasTotal = watchedExtras.reduce((sum, e) => sum + e.amount_usd, 0)
  const totalUsd = watchedPriceUsd + extrasTotal
  const totalNgn = usdToNgn(totalUsd, watchedExchangeRate)

  async function onSubmit(values: DealFormValues) {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Build car snapshot
      const carSnapshot = selectedCar
        ? {
            make: selectedCar.make,
            model: selectedCar.model,
            year: selectedCar.year,
            color_exterior: selectedCar.color_exterior,
            condition: selectedCar.condition,
            price_usd: selectedCar.price_usd,
          }
        : {
            make: values.manual_make ?? '',
            model: values.manual_model ?? '',
            year: values.manual_year ?? 0,
            color_exterior: null,
            condition: null,
            price_usd: values.price_usd,
          }

      const priceNgn = usdToNgn(values.price_usd, values.exchange_rate)
      const totalUsdFinal = values.price_usd + extrasTotal
      const totalNgnFinal = usdToNgn(totalUsdFinal, values.exchange_rate)

      const { data: deal, error } = await supabase
        .from('deal_sheets')
        .insert({
          lead_id: values.lead_id ?? null,
          car_id: values.car_id ?? null,
          car_snapshot: carSnapshot,
          client_name: values.client_name,
          price_usd: values.price_usd,
          exchange_rate: values.exchange_rate,
          price_ngn: priceNgn,
          extras: values.extras,
          total_usd: totalUsdFinal,
          total_ngn: totalNgnFinal,
          valid_hours: values.valid_hours,
          generated_by: user?.id ?? null,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/deals/${deal.id}`)
    } catch (err) {
      console.error('Failed to create deal:', err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  const availableCars = cars?.filter((c) => c.status === 'available') ?? []

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-inter font-semibold',
              step === s
                ? 'bg-ink text-white'
                : step > s
                ? 'bg-success text-white'
                : 'bg-surface-muted text-ink-muted'
            )}>
              {step > s ? '✓' : s}
            </div>
            {s < 3 && <div className={cn('h-px flex-1 w-8', step > s ? 'bg-success' : 'bg-[var(--border)]')} />}
          </div>
        ))}
        <p className="ml-2 font-inter text-xs text-ink-muted">
          {step === 1 ? 'Car & Client' : step === 2 ? 'Pricing' : 'Review'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Step 1 — Car & Client */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Input
              id="client_name"
              label="Client Name"
              placeholder="Emeka Okafor"
              error={errors.client_name?.message}
              {...register('client_name')}
            />

            {/* Car selection */}
            {!useManualCar ? (
              <div className="flex flex-col gap-1.5">
                <Select
                  id="car_id"
                  label="Select Vehicle"
                  {...register('car_id')}
                >
                  <option value="">Select from inventory...</option>
                  {availableCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.year} {car.make} {car.model} — {formatUSD(car.price_usd)}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => setUseManualCar(true)}
                  className="text-xs text-navy font-inter text-left hover:underline"
                >
                  Car not in inventory? Enter manually →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-inter text-sm font-medium text-ink">Manual Vehicle Entry</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Year" type="number"
                    {...register('manual_year', { valueAsNumber: true })} />
                  <Input placeholder="Make" {...register('manual_make')} />
                  <Input placeholder="Model" {...register('manual_model')} />
                </div>
                <button
                  type="button"
                  onClick={() => setUseManualCar(false)}
                  className="text-xs text-navy font-inter text-left hover:underline"
                >
                  ← Select from inventory
                </button>
              </div>
            )}

            <Button
              type="button"
              onClick={() => setStep(2)}
              className="w-full mt-2"
            >
              Next →
            </Button>
          </div>
        )}

        {/* Step 2 — Pricing */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Input
              id="price_usd"
              label="Vehicle Price (USD)"
              type="number"
              error={errors.price_usd?.message}
              {...register('price_usd', { valueAsNumber: true })}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink font-inter">
                Exchange Rate (₦ per $1)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="flex-1 min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink focus:outline-none focus:ring-2 focus:ring-navy tabular-nums"
                  {...register('exchange_rate', { valueAsNumber: true })}
                />
                <span className="text-xs text-ink-muted font-inter shrink-0">
                  {exchangeRateData?.source === 'fresh' ? '● Live' : '● Cached'}
                </span>
              </div>
            </div>

            <Controller
              name="extras"
              control={control}
              render={({ field }) => (
                <ExtrasBuilder
                  extras={field.value ?? []}
                  exchangeRate={watchedExchangeRate}
                  onChange={field.onChange}
                />
              )}
            />

            <Input
              id="valid_hours"
              label="Valid for (hours)"
              type="number"
              {...register('valid_hours', { valueAsNumber: true })}
            />

            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button type="button" className="flex-1" onClick={() => setStep(3)}>
                Review →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
              {[
                { label: 'Client', value: watch('client_name') },
                {
                  label: 'Vehicle',
                  value: selectedCar
                    ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`
                    : `${watch('manual_year') ?? ''} ${watch('manual_make') ?? ''} ${watch('manual_model') ?? ''}`,
                },
                { label: 'Vehicle Price', value: formatUSD(watchedPriceUsd) },
                { label: 'Extras', value: formatUSD(extrasTotal) },
                { label: 'Exchange Rate', value: `₦${watchedExchangeRate.toLocaleString()}/$` },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <span className="font-inter text-sm text-ink-muted">{row.label}</span>
                  <span className="font-inter text-sm font-medium text-ink">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-ink rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-inter text-sm text-white/70">Total</span>
                <span className="font-inter text-xl font-semibold text-gold tabular-nums">
                  {formatUSD(totalUsd)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-white/50">NGN equivalent</span>
                <span className="font-inter text-sm text-white/80 tabular-nums">
                  {formatNGN(totalNgn)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button type="submit" className="flex-1" loading={saving}>
                Generate Deal
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
