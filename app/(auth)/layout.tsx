// Layout for auth pages (login, signup).
// Centers the content on screen with a clean background.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
