export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/[\s_-]+/g, '-')   // spaces/underscores to hyphens
    .replace(/^-+|-+$/g, '')    // trim leading/trailing hyphens
}

export function generateCarSlug(year: number, make: string, model: string): string {
  const base = slugify(`${year} ${make} ${model}`)
  const suffix = Math.random().toString(36).substring(2, 7) // 5-char random suffix
  return `${base}-${suffix}`
}
