'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { generateCarSlug } from '@/lib/slugify'
import { logActivity } from '@/lib/activity/log'
import { formatCarTitle } from '@/lib/formatters'
import { deleteCarImage } from '@/lib/supabase/storage'
import type { Car, CarStatus, CarLifecycleStatus, PendingCarImage } from '@/lib/supabase/types'
import type { CarFormValues } from '@/lib/validations/car.schema'

const supabase = createClient()

// --- Query keys ---
export const carKeys = {
  all: ['cars'] as const,
  lists: () => [...carKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...carKeys.lists(), filters] as const,
  detail: (slug: string) => [...carKeys.all, 'detail', slug] as const,
}

// --- Fetch cars in a given lifecycle state, with cover image ---
// Defaults to 'active' so the main Inventory list and every existing caller
// (e.g. the deal-sheet car picker) only ever sees live cars. 'archived' powers
// the Archived tab. 'deleted' is never fetched by any app surface.
async function fetchCars(lifecycle: CarLifecycleStatus): Promise<Car[]> {
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      car_images (
        id, url, sort_order, is_cover
      )
    `)
    .eq('lifecycle_status', lifecycle)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Car[]
}

// --- Fetch single car by slug ---
// Active and archived cars both resolve (the detail page is reachable from the
// Archived tab so admins can Restore/Delete). 'deleted' cars are treated as
// not-found, keeping them invisible everywhere in the app even via direct URL.
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
    .neq('lifecycle_status', 'deleted')
    .single()

  if (error) throw error
  return data as Car
}

// --- Hooks ---

// Mirrors the useDeals(archived) shape: one source of truth for car list
// queries, parameterised by lifecycle. Defaults to 'active'.
export function useCars(lifecycle: CarLifecycleStatus = 'active') {
  return useQuery({
    queryKey: carKeys.list({ lifecycle }),
    queryFn: () => fetchCars(lifecycle),
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
    mutationFn: async ({
      values,
      pendingImages = [],
    }: {
      values: CarFormValues
      pendingImages?: PendingCarImage[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()

      const slug = generateCarSlug(values.year, values.make, values.model)

      // Photos are uploaded to Storage and held in form state before the car
      // exists (see ImageUploader's pending mode). create_car_with_images
      // inserts the car and attaches them to it in one transaction — if the
      // image insert fails, the car insert rolls back with it, so there's no
      // window where a car exists with zero images and no compensating
      // delete (with a discarded error) to fall back on.
      const { data, error } = await supabase.rpc('create_car_with_images', {
        car: { ...values, slug, added_by: user?.id ?? null },
        images: pendingImages.map((img, i) => ({
          url: img.url,
          sort_order: i,
          is_cover: img.isCover,
        })),
      })

      if (error) {
        // The car row never committed (or never existed), so the Storage
        // objects these photos were uploaded to are now unreachable from
        // anywhere in the app — clean them up rather than leave them in the
        // bucket forever. Best-effort: a delete failure here is logged, not
        // rethrown, so it can't mask the real error from the failed create.
        await Promise.all(
          pendingImages.map((img) =>
            deleteCarImage(img.url).catch((cleanupErr) =>
              console.error('Failed to clean up orphaned car image after aborted create:', cleanupErr)
            )
          )
        )
        throw error
      }
      const car = data as Car

      // Record the new vehicle in the activity feed. logActivity never
      // throws, so a logging failure can't break the (already-saved) car.
      await logActivity(supabase, {
        actor_id: user?.id ?? null,
        action_type: 'car_created',
        entity_type: 'car',
        entity_id: car.id,
        description: `Added ${formatCarTitle(car.make, car.model, car.year)}`,
      })

      return car
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
      const car = data as Car

      // Record the status change in the activity feed. Fire-and-forget so it
      // can never block or fail the status update itself — logActivity already
      // swallows insert errors, and the outer guard covers the getUser lookup.
      void (async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          await logActivity(supabase, {
            actor_id: user?.id ?? null,
            action_type: 'car_status_changed',
            entity_type: 'car',
            entity_id: car.id,
            description: `marked ${formatCarTitle(car.make, car.model, car.year)} as ${car.status}`,
          })
        } catch (err) {
          console.error(
            'Failed to log car status activity:',
            err instanceof Error ? err.message : String(err)
          )
        }
      })()

      return car
    },
    // Optimistic update: patch every cached 'cars' entry the UI reads from
    // (the list at ['cars','list'] and any detail at ['cars','detail',slug])
    // before the network resolves, so the badge changes instantly on tap.
    onMutate: async ({ id, status, reserved_for }) => {
      // Stop any in-flight refetch from clobbering the optimistic value.
      await queryClient.cancelQueries({ queryKey: carKeys.all })

      // Snapshot the complete previous state for an exact rollback on failure.
      const previous = queryClient.getQueriesData<Car[] | Car>({ queryKey: carKeys.all })

      // Mirror the mutationFn's own rule: reserved_for only persists for reserved.
      const nextReservedFor = status === 'reserved' ? reserved_for ?? null : null

      // Field-level merge — never replace the whole object/array, so images,
      // price, notes and every other field are preserved.
      queryClient.setQueriesData<Car[] | Car>({ queryKey: carKeys.all }, (old) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.map((c) =>
            c.id === id ? { ...c, status, reserved_for: nextReservedFor } : c
          )
        }
        if (old.id === id) {
          return { ...old, status, reserved_for: nextReservedFor }
        }
        return old
      })

      return { previous }
    },
    // Roll back to the exact captured snapshots; the inline error in
    // StatusQuickUpdate surfaces the failure to the user.
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    // Reconcile with the server's actual row regardless of success/failure,
    // covering any side effects (triggers/defaults) on the updated row.
    onSettled: () => {
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

// Moves a car between lifecycle states (active ↔ archived → deleted). This is
// the only path that ever changes lifecycle_status and is always a plain
// UPDATE — there is no hard-delete of cars anywhere in the app. Invalidates the
// whole 'cars' tree so the Active list, Archived list and detail view all
// reconcile after the transition.
export function useSetCarLifecycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, lifecycle }: { id: string; lifecycle: CarLifecycleStatus }) => {
      const { data, error } = await supabase
        .from('cars')
        .update({
          lifecycle_status: lifecycle,
          lifecycle_changed_at: new Date().toISOString(),
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
