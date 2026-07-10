'use client'

import { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  carSchema,
  type CarFormValues,
  type CarFormInput,
} from '@/lib/validations/car.schema'
import { useCar, useUpdateCar } from '@/hooks/useCars'
import { CarForm } from '@/components/inventory/CarForm'
import { useToast } from '@/components/ui/Toast'

export default function EditCarPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: car, isLoading } = useCar(slug)
  const updateCar = useUpdateCar()
  const showToast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarFormInput, unknown, CarFormValues>({
    resolver: zodResolver(carSchema),
  })

  // Pre-fill the form once, on initial load. Without this guard, any background
  // refetch of the car query (e.g. the invalidation triggered after an image
  // upload) would re-run reset() with fresh data — wiping in-progress edits and
  // surfacing a Zod coerce error from the numeric fields.
  const hasReset = useRef(false)

  useEffect(() => {
    if (car && !hasReset.current) {
      hasReset.current = true
      reset({
        make: car.make,
        model: car.model,
        year: car.year,
        body_type: car.body_type ?? undefined,
        color_exterior: car.color_exterior ?? undefined,
        color_interior: car.color_interior ?? undefined,
        mileage_km: car.mileage_km ?? 0,
        condition: car.condition,
        transmission: car.transmission ?? undefined,
        fuel_type: car.fuel_type ?? undefined,
        engine_cc: car.engine_cc ?? undefined,
        horsepower: car.horsepower ?? undefined,
        price_usd: car.price_usd,
        status: car.status,
        reserved_for: car.reserved_for ?? undefined,
        notes: car.notes ?? undefined,
        // ?? true guards the brief window where code has shipped but the
        // is_public migration hasn't run yet (column absent -> undefined),
        // so an existing car never resets to an unchecked (hidden) toggle.
        is_public: car.is_public ?? true,
      })
    }
  }, [car, reset])

  async function onSubmit(values: CarFormValues) {
    if (!car) return
    try {
      await updateCar.mutateAsync({ id: car.id, values })
      showToast('Changes saved', 'success')
      router.push(`/inventory/${slug}`)
    } catch (err) {
      console.error(
        'Failed to update car:',
        err instanceof Error ? err.message : String(err)
      )
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
      <CarForm
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
        loading={isSubmitting || updateCar.isPending}
        isError={updateCar.isError}
        submitLabel="Save Changes"
        onCancel={() => router.back()}
        carId={car.id}
        images={car.car_images ?? []}
      />
    </div>
  )
}
