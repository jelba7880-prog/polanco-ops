'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  leadSchema,
  type LeadFormInput,
  type LeadFormValues,
} from '@/lib/validations/lead.schema'
import { useCreateLead } from '@/hooks/useLeads'
import { useProfiles } from '@/hooks/useProfiles'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { SourceChips } from '@/components/leads/SourceChips'

export default function AddLeadPage() {
  const router = useRouter()
  const createLead = useCreateLead()
  const { data: profiles } = useProfiles()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormInput, unknown, LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: 'whatsapp',
      status: 'new',
    },
  })

  async function onSubmit(values: LeadFormValues) {
    try {
      const lead = await createLead.mutateAsync(values)
      router.push(`/leads/${lead.id}`)
    } catch (err) {
      console.error('Failed to create lead:', err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <p className="text-sm text-ink-muted font-inter mb-6">
        Log a new customer enquiry. Phone number will be normalized automatically.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Name */}
        <Input
          id="name"
          label="Full Name"
          placeholder="Tunde Bakare"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Phone */}
        <Input
          id="phone"
          label="Phone Number"
          placeholder="08012345678"
          type="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />

        {/* Email */}
        <Input
          id="email"
          label="Email (optional)"
          placeholder="tunde@email.com"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Car Interest */}
        <Input
          id="car_interest"
          label="Car Interest"
          placeholder="2023 Bentley Bentayga"
          {...register('car_interest')}
        />

        {/* Source */}
        <Controller
          name="source"
          control={control}
          render={({ field }) => (
            <SourceChips
              label="Source"
              value={field.value ?? 'whatsapp'}
              onChange={field.onChange}
              error={errors.source?.message}
            />
          )}
        />

        {/* Assign To */}
        <Select
          id="assigned_to"
          label="Assign To"
          {...register('assigned_to')}
        >
          <option value="">Unassigned</option>
          {profiles?.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name}
            </option>
          ))}
        </Select>

        {/* Initial Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink font-inter">
            Notes (optional)
          </label>
          <textarea
            placeholder="Any initial context about this lead..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            {...register('notes')}
          />
        </div>

        {/* Mutation error */}
        {createLead.isError && (
          <p className="text-sm text-danger font-inter">
            Failed to save lead. Please try again.
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
            loading={isSubmitting || createLead.isPending}
          >
            Save Lead
          </Button>
        </div>

      </form>
    </div>
  )
}
