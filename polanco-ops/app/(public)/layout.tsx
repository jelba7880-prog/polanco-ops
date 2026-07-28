import { PublicHalftoneBackground } from '@/components/showcase/PublicHalftoneBackground'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The halftone background is position:fixed (viewport-sized, not tied to
  // this div's box), so it needs no positioning context here — this wrapper
  // just carries overflow-x-hidden for the rest of the showcase.
  return (
    <div className="w-full overflow-x-hidden">
      <PublicHalftoneBackground />
      {children}
    </div>
  )
}
