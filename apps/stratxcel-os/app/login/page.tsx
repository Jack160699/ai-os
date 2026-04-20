import { Suspense } from "react";
import { LoginForm } from "@/components/os/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
