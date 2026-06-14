import { z } from 'zod'

export const carSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .number({ error: 'Year must be a number' })
    .int()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Year is too far in the future'),
  body_type: z.string().optional(),
  color_exterior: z.string().optional(),
  color_interior: z.string().optional(),
  mileage_km: z.number().int().min(0).optional().default(0),
  condition: z.enum(['New', 'Foreign Used', 'Locally Used']),
  transmission: z.enum(['Automatic', 'Manual']).optional(),
  fuel_type: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid']).optional(),
  engine_cc: z.number().int().positive().optional(),
  horsepower: z.number().int().positive().optional(),
  price_usd: z
    .number({ error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  status: z.enum(['available', 'reserved', 'sold', 'in_transit']).default('available'),
  reserved_for: z.string().optional(),
  notes: z.string().optional(),
})

// Output type (after defaults are applied) — what a successful submit yields.
export type CarFormValues = z.infer<typeof carSchema>
// Input type (before defaults) — what the form fields collect. Fields with a
// `.default()` (mileage_km, status) are optional on the way in.
export type CarFormInput = z.input<typeof carSchema>

// Partial schema for updates — all fields optional
export const carUpdateSchema = carSchema.partial()
export type CarUpdateValues = z.infer<typeof carUpdateSchema>
