'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  carSchema,
  type CarFormValues,
  type CarFormInput,
} from '@/lib/validations/car.schema'
import { useCreateCar } from '@/hooks/useCars'
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

export default function AddCarPage() {
  const router = useRouter()
  const createCar = useCreateCar()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CarFormInput, unknown, CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      condition: 'Foreign Used',
      status: 'available',
      mileage_km: 0,
    },
  })

  async function onSubmit(values: CarFormValues) {
    try {
      await createCar.mutateAsync(values)
      router.push('/inventory')
    } catch (err) {
      console.error('Failed to create car:', err)
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <p className="text-sm text-ink-muted font-inter mb-6">
        Fill in the vehicle details below. You can add photos after saving.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Make & Model */}
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

        {/* Year & Price */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Year"
            type="number"
            placeholder="2023"
            error={errors.year?.message}
            {...register('year', { valueAsNumber: true })}
          />
          <Input
            label="Price (USD)"
            type="number"
            placeholder="350000"
            error={errors.price_usd?.message}
            {...register('price_usd', { valueAsNumber: true })}
          />
        </div>

        {/* Condition */}
        <Select
          label="Condition"
          error={errors.condition?.message}
          {...register('condition')}
        >
          <option value="New">New</option>
          <option value="Foreign Used">Foreign Used</option>
          <option value="Locally Used">Locally Used</option>
        </Select>

        {/* Status */}
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

        {/* Transmission & Fuel */}
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

        {/* Mileage */}
        <Input
          label="Mileage (km)"
          type="number"
          placeholder="0"
          error={errors.mileage_km?.message}
          {...register('mileage_km', optionalNumber)}
        />

        {/* Colors */}
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

        {/* Body type */}
        <Input
          label="Body Type"
          placeholder="SUV"
          {...register('body_type')}
        />

        {/* Engine */}
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

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink font-inter">Notes</label>
          <textarea
            placeholder="Any additional details about this vehicle..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            {...register('notes')}
          />
        </div>

        {/* Error from mutation */}
        {createCar.isError && (
          <p className="text-sm text-danger font-inter">
            Failed to save vehicle. Please try again.
          </p>
        )}

        {/* Actions */}
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
            loading={isSubmitting || createCar.isPending}
          >
            Save Vehicle
          </Button>
        </div>
      </form>
    </div>
  )
}
