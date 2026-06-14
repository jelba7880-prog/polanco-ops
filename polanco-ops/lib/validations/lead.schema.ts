import { z } from 'zod'
import { normalizeNigerianPhone } from '@/lib/formatters'

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .transform((val) => normalizeNigerianPhone(val)),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  car_interest: z.string().optional(),
  car_id: z.string().uuid().optional(),
  source: z.enum(['whatsapp', 'instagram', 'walkin', 'call', 'referral']).default('whatsapp'),
  status: z.enum(['new', 'contacted', 'test_drive', 'negotiating', 'closed_won', 'closed_lost']).default('new'),
  assigned_to: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  notes: z.string().optional(),
})

// Output type (after defaults/transforms are applied) — what a successful submit yields.
export type LeadFormValues = z.infer<typeof leadSchema>
// Input type (before defaults/transforms) — what the form fields collect.
export type LeadFormInput = z.input<typeof leadSchema>

// Partial schema for updates — all fields optional
export const leadUpdateSchema = leadSchema.partial()
export type LeadUpdateValues = z.infer<typeof leadUpdateSchema>
