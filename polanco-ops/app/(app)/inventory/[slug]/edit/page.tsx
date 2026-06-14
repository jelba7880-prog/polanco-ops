'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  carSchema,
  type CarFormValues,
  type CarFormInput,
} from '@/lib/validations/car.schema'
import { useCar, useUpdateCar } from '@/hooks/useCars'
import { ImageUploader } from '@/components/inventory/ImageUploader'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

// Optional number inputs come through as '' when left blank; with
// `valueAsNumber` that becomes NaN, which Zod rejects. Coerce blanks to
// undefined so optional fields validate (and defaults can kick in).
const optionalNumber = {
  setValueAs: (v: unknown) => {
    if (v === '' || v === null || v === undefined) return undefined
    const n = Number(v)
    return Number.isNaN(n) ? undefined : n
  },
}

// Optional enum selects default to the empty "Select..." option; '' is not a
// valid enum value, so coerce it to undefined to satisfy `.optional()`.
const optionalSelect = {
  setValueAs: (v: unknown) => (v === '' ? undefined : v),
}

export default function EditCarPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: car, isLoading } = useCar(slug)
  const updateCar = useUpdateCar()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarFormInput, unknown, CarFormValues>({
    resolver: zodResolver(carSchema),
  })

  // Pre-fill form once car data loads
  useEffect(() => {
    if (car) {
      reset({
        make: car.make,
        model: car.model,
        year: car.year,
        body_type: car.body_type ?? undefined,
        color_exterior: car.color_exterior ?? undefined,
        color_interior: car.color_interior ?? undefined,
        mileage_km: car.mileage_km,
        condition: car.condition,
        transmission: car.transmission ?? undefined,
        fuel_type: car.fuel_type ?? undefined,
        engine_cc: car.engine_cc ?? undefined,
        horsepower: car.horsepower ?? undefined,
        price_usd: car.price_usd,
        status: car.status,
        reserved_for: car.reserved_for ?? undefined,
        notes: car.notes ?? undefined,
      })
    }
  }, [car, reset])

  async function onSubmit(values: CarFormValues) {
    if (!car) return
    try {
      await updateCar.mutateAsync({ id: car.id, values })
      router.push(`/inventory/${slug}`)
    } catch (err) {
      console.error('Failed to update car:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="h-32 bg-surface-muted rounded-xl animate-pulse mb-4" />
        <div className="h-12 bg-surface-muted rounded-xl animate-pulse mb-3" />
        <div className="h-12 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-danger font-inter">Vehicle not found.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">

      {/* Image uploader — above the form */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-4 mb-6">
        <ImageUploader
          carId={car.id}
          images={car.car_images ?? []}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Make" error={errors.make?.message} {...register('make')} />
          <Input label="Model" error={errors.model?.message} {...register('model')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Year"
            type="number"
            error={errors.year?.message}
            {...register('year', { valueAsNumber: true })}
          />
          <Input
            label="Price (USD)"
            type="number"
            error={errors.price_usd?.message}
            {...register('price_usd', { valueAsNumber: true })}
          />
        </div>

        <Select label="Condition" error={errors.condition?.message} {...register('condition')}>
          <option value="New">New</option>
          <option value="Foreign Used">Foreign Used</option>
          <option value="Locally Used">Locally Used</option>
        </Select>

        <Select label="Status" error={errors.status?.message} {...register('status')}>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="in_transit">In Transit</option>
          <option value="sold">Sold</option>
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Transmission" {...register('transmission', optionalSelect)}>
            <option value="">Select...</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </Select>
          <Select label="Fuel Type" {...register('fuel_type', optionalSelect)}>
            <option value="">Select...</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </Select>
        </div>

        <Input
          label="Mileage (km)"
          type="number"
          {...register('mileage_km', optionalNumber)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Exterior Color" {...register('color_exterior')} />
          <Input label="Interior Color" {...register('color_interior')} />
        </div>

        <Input label="Body Type" {...register('body_type')} />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Engine (cc)"
            type="number"
            {...register('engine_cc', optionalNumber)}
          />
          <Input
            label="Horsepower"
            type="number"
            {...register('horsepower', optionalNumber)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink font-inter">Notes</label>
          <textarea
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            {...register('notes')}
          />
        </div>

        {updateCar.isError && (
          <p className="text-sm text-danger font-inter">
            Failed to save changes. Please try again.
          </p>
        )}

        <div className="flex gap-3 pt-2 pb-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={isSubmitting || updateCar.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
