import { createClient } from '@/lib/supabase/client'
import compressImage from 'browser-image-compression'

const BUCKET = 'car-images'
const MAX_SIZE_MB = 1.5
const MAX_WIDTH_PX = 1920

export async function uploadCarImage(
  carId: string,
  file: File
): Promise<string> {
  // Compress first
  const compressed = await compressImage(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_PX,
    useWebWorker: true,
  })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${carId}/${Date.now()}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, compressed, {
      contentType: compressed.type,
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

export async function deleteCarImage(url: string): Promise<void> {
  // Extract the path after the bucket name from the public URL
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) throw new Error('Invalid image URL')
  const path = url.slice(idx + marker.length)

  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
