import { createClient } from '@/lib/supabase/client'
import compressImage from 'browser-image-compression'

const BUCKET = 'car-images'
const MAX_SIZE_MB = 1.5
const MAX_WIDTH_PX = 1920

// `folderId` namespaces the Storage path and isn't required to be a real car
// id — the Add Vehicle flow uploads photos before a car exists yet, so it
// passes a temporary id per file. The path is never read back by id, only by
// URL, so nothing needs to change when the file is later attached to a car.
export async function uploadCarImage(
  folderId: string,
  file: File
): Promise<string> {
  // Compress first, falling back to the original file if compression fails
  // (e.g. unsupported format or worker error) so the upload can still proceed.
  let compressed: File = file
  try {
    compressed = await compressImage(file, {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH_PX,
      useWebWorker: true,
    })
  } catch (compressionError) {
    console.warn('Image compression failed, uploading original file:', compressionError)
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${folderId}/${Date.now()}.${ext}`
  const contentType = compressed.type || file.type || 'image/jpeg'

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, compressed, {
      contentType,
      upsert: false,
    })

  if (error) {
    console.error('Storage upload error:', JSON.stringify(error))
    throw error
  }

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
