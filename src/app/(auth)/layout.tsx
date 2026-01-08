export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary-50 to-primary-100">
      {children}
    </div>
  );
}
