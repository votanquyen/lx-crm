export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-primary-50 to-primary-100 flex min-h-screen items-center justify-center bg-linear-to-br">
      {children}
    </div>
  );
}
