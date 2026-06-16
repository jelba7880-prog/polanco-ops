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
import { CarForm } from '@/components/inventory/CarForm'
import { useToast } from '@/components/ui/Toast'

export default function AddCarPage() {
  const router = useRouter()
  const createCar = useCreateCar()
  const showToast = useToast()

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
      showToast('Vehicle added', 'success')
      router.push('/inventory')
    } catch (err) {
      console.error('Failed to create car:', err)
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <CarForm
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
        loading={isSubmitting || createCar.isPending}
        isError={createCar.isError}
        submitLabel="Save Vehicle"
        onCancel={() => router.back()}
      />
    </div>
  )
}
