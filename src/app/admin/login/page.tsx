import { Logo } from "@/components/storefront/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <h1 className="font-display font-bold text-lg text-foreground mb-1">Admin sign in</h1>
          <p className="text-sm text-muted mb-5">Manage products, orders and inventory.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
