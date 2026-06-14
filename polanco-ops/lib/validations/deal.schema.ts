import { z } from 'zod'

export const extraSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  amount_usd: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
})

export const dealSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  car_id: z.string().uuid().optional(),
  // Manual entry fallback when car not in inventory
  manual_make: z.string().optional(),
  manual_model: z.string().optional(),
  manual_year: z.number().int().optional(),
  price_usd: z
    .number({ error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  exchange_rate: z
    .number({ error: 'Exchange rate must be a number' })
    .positive(),
  extras: z.array(extraSchema).default([]),
  lead_id: z.string().uuid().optional(),
  valid_hours: z.number().int().positive().default(48),
})

// Output type (after defaults are applied) — what a successful submit yields.
export type DealFormValues = z.infer<typeof dealSchema>
// Input type (before defaults) — what the form fields collect.
export type DealFormInput = z.input<typeof dealSchema>
export type ExtraItem = z.infer<typeof extraSchema>
