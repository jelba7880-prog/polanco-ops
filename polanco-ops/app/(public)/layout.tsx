import { PublicHalftoneBackground } from '@/components/showcase/PublicHalftoneBackground'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // `relative` only positions the decorative halftone layer beneath the
  // showcase content; z-index:auto is deliberate here so no new stacking
  // context is introduced around children (see the canvas's own comment).
  return (
    <div className="relative w-full overflow-x-hidden">
      <PublicHalftoneBackground />
      {children}
    </div>
  )
}
