'use client'

import type { FormEventHandler } from 'react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { CarFormInput } from '@/lib/validations/car.schema'
import { ImageUploader } from '@/components/inventory/ImageUploader'
import type { CarImage, PendingCarImage } from '@/lib/supabase/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const optionalNumber = {
  setValueAs: (v: unknown) => {
    if (v === '' || v === null || v === undefined) return undefined
    const n = Number(v)
    return Number.isNaN(n) ? undefined : n
  },
}

const optionalSelect = {
  setValueAs: (v: unknown) => (v === '' ? undefined : v),
}

interface CarFormProps {
  register: UseFormRegister<CarFormInput>
  errors: FieldErrors<CarFormInput>
  onSubmit: FormEventHandler<HTMLFormElement>
  loading: boolean
  isError: boolean
  submitLabel: string
  onCancel: () => void
  carId?: string
  images?: CarImage[]
  pendingImages?: PendingCarImage[]
  onPendingImagesChange?: (next: PendingCarImage[]) => void
}

function SectionHeader({ label }: { label: string }) {
  return (
    <>
      <hr className="border-t border-[var(--border)] mb-3" />
      <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-ink-muted mb-3">
        {label}
      </p>
    </>
  )
}

export function CarForm({
  register,
  errors,
  onSubmit,
  loading,
  isError,
  submitLabel,
  onCancel,
  carId,
  images,
  pendingImages,
  onPendingImagesChange,
}: CarFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">

      {/* ── Basic Info ─────────────────────────────────────────── */}
      <div>
        <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-ink-muted mb-3">
          Basic Info
        </p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Make"
              placeholder="Lamborghini"
              error={errors.make?.message}
              {...register('make')}
            />
            <Input
              label="Model"
              placeholder="Urus"
              error={errors.model?.message}
              {...register('model')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Year"
              type="number"
              placeholder="2023"
              error={errors.year?.message}
              {...register('year', { valueAsNumber: true })}
            />
            <Input
              label="Body Type"
              placeholder="SUV"
              {...register('body_type')}
            />
          </div>
        </div>
      </div>

      {/* ── Specs ──────────────────────────────────────────────── */}
      <div>
        <SectionHeader label="Specs" />
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Condition"
              error={errors.condition?.message}
              {...register('condition')}
            >
              <option value="New">New</option>
              <option value="Foreign Used">Foreign Used</option>
              <option value="Locally Used">Locally Used</option>
            </Select>
            <Input
              label="Mileage (km)"
              type="number"
              placeholder="0"
              error={errors.mileage_km?.message}
              {...register('mileage_km', optionalNumber)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Engine (cc)"
              type="number"
              placeholder="3996"
              {...register('engine_cc', optionalNumber)}
            />
            <Input
              label="Horsepower"
              type="number"
              placeholder="641"
              {...register('horsepower', optionalNumber)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Transmission"
              {...register('transmission', optionalSelect)}
            >
              <option value="">Select...</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </Select>
            <Select
              label="Fuel Type"
              {...register('fuel_type', optionalSelect)}
            >
              <option value="">Select...</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Appearance ─────────────────────────────────────────── */}
      <div>
        <SectionHeader label="Appearance" />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Exterior Color"
            placeholder="Nero Nemesis"
            {...register('color_exterior')}
          />
          <Input
            label="Interior Color"
            placeholder="Cognac"
            {...register('color_interior')}
          />
        </div>
      </div>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <div>
        <SectionHeader label="Pricing" />
        <div className="flex flex-col gap-3">
          <Input
            label="Price (USD)"
            type="number"
            placeholder="350000"
            error={errors.price_usd?.message}
            {...register('price_usd', { valueAsNumber: true })}
          />
          <Select
            label="Status"
            error={errors.status?.message}
            {...register('status')}
          >
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="in_transit">In Transit</option>
            <option value="sold">Sold</option>
          </Select>
        </div>
      </div>

      {/* ── Images ─────────────────────────────────────────────── */}
      <div>
        <SectionHeader label="Images" />
        <div className="bg-white rounded-xl border border-[var(--border)] p-4">
          <ImageUploader
            carId={carId}
            images={images}
            pendingImages={pendingImages}
            onPendingImagesChange={onPendingImagesChange}
          />
        </div>
      </div>

      {/* ── Notes ──────────────────────────────────────────────── */}
      <div>
        <SectionHeader label="Notes" />
        <textarea
          placeholder="Any additional details about this vehicle..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy resize-none"
          {...register('notes')}
        />
      </div>

      {isError && (
        <p className="text-sm text-danger font-inter">
          Failed to save vehicle. Please try again.
        </p>
      )}

      <div className="flex gap-3 pt-2 pb-4">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
