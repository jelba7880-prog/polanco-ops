'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import { uploadCarImage, deleteCarImage } from '@/lib/supabase/storage'
import { carKeys } from '@/hooks/useCars'
import type { CarImage } from '@/lib/supabase/types'

export function useAddCarImage(carId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      isFirst,
    }: {
      file: File
      isFirst: boolean
    }): Promise<CarImage> => {
      const supabase = createClient()

      // Upload to storage
      const url = await uploadCarImage(carId, file)

      // Find the current max sort_order for this car so we can append. Using a
      // sequential position (0, 1, 2, ...) keeps the value within the int
      // column — a Date.now() timestamp overflows it (Postgres error 22003).
      const { data: existing } = await supabase
        .from('car_images')
        .select('sort_order')
        .eq('car_id', carId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextSortOrder = (existing?.sort_order ?? -1) + 1

      // Insert into car_images table
      const { data, error } = await supabase
        .from('car_images')
        .insert({
          car_id: carId,
          url,
          sort_order: nextSortOrder,
          is_cover: isFirst, // first image is automatically the cover
        })
        .select()
        .single()

      if (error) {
        console.error('car_images insert failed:', error)
        Sentry.captureException(error, { tags: { scope: 'car-image-add' }, extra: { carId } })
        throw error
      }
      return data as CarImage
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.all })
    },
  })
}

export function useDeleteCarImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      imageId,
      url,
    }: {
      imageId: string
      url: string
    }) => {
      const supabase = createClient()

      // Delete from storage first
      await deleteCarImage(url)

      // Then remove from table
      const { error } = await supabase
        .from('car_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.all })
    },
  })
}

export function useSetCoverImage(carId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (imageId: string) => {
      const supabase = createClient()

      // Unset all covers for this car first
      await supabase
        .from('car_images')
        .update({ is_cover: false })
        .eq('car_id', carId)

      // Set the new cover
      const { error } = await supabase
        .from('car_images')
        .update({ is_cover: true })
        .eq('id', imageId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.all })
    },
  })
}
