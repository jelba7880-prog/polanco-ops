'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { generateCarSlug } from '@/lib/slugify'
import type { Car, CarStatus } from '@/lib/supabase/types'
import type { CarFormValues } from '@/lib/validations/car.schema'

const supabase = createClient()

// --- Query keys ---
export const carKeys = {
  all: ['cars'] as const,
  lists: () => [...carKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...carKeys.lists(), filters] as const,
  detail: (slug: string) => [...carKeys.all, 'detail', slug] as const,
}

// --- Fetch all cars with cover image ---
async function fetchCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      car_images (
        id, url, sort_order, is_cover
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Car[]
}

// --- Fetch single car by slug ---
async function fetchCarBySlug(slug: string): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      car_images (
        id, url, sort_order, is_cover
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as Car
}

// --- Hooks ---

export function useCars() {
  return useQuery({
    queryKey: carKeys.lists(),
    queryFn: fetchCars,
  })
}

export function useCar(slug: string) {
  return useQuery({
    queryKey: carKeys.detail(slug),
    queryFn: () => fetchCarBySlug(slug),
    enabled: !!slug,
  })
}

export function useCreateCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: CarFormValues) => {
      const { data: { user } } = await supabase.auth.getUser()

      const slug = generateCarSlug(values.year, values.make, values.model)

      const { data, error } = await supabase
        .from('cars')
        .insert({
          ...values,
          slug,
          added_by: user?.id ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Car
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.lists() })
    },
  })
}

export function useUpdateCarStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reserved_for,
    }: {
      id: string
      status: CarStatus
      reserved_for?: string
    }) => {
      const { data, error } = await supabase
        .from('cars')
        .update({
          status,
          // Clear reserved_for whenever the car moves away from 'reserved'.
          reserved_for: status === 'reserved' ? reserved_for ?? null : null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Car
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.all })
    },
  })
}

export function useUpdateCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<CarFormValues> }) => {
      const { data, error } = await supabase
        .from('cars')
        .update(values)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Car
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: carKeys.all })
    },
  })
}

export function useDeleteCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.lists() })
    },
  })
}
