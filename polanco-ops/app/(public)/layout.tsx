export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="w-full overflow-x-hidden">{children}</div>
}
