import { loginAction } from "@/app/v2/login/actions";
import { LoginSubmitButton } from "@/components/v2/login-submit-button";

const ERROR_TEXT = {
  missing_credentials: "Email and password are required.",
  invalid_credentials: "Invalid login credentials.",
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error ? ERROR_TEXT[params.error] : "";

  return (
    <main className="grid min-h-screen place-items-center bg-[#090d16] p-6 text-[#f1f5f9]">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_70px_rgba(2,6,23,0.45)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#60a5fa]">StratXcel</p>
        <h1 className="mt-3 text-2xl font-semibold">Admin Dashboard V2</h1>
        <p className="mt-1 text-sm text-white/65">Sign in to continue</p>

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-white/60">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#60a5fa] focus:outline-none"
              placeholder="admin@stratxcel.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-white/60">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#60a5fa] focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          <LoginSubmitButton />
        </form>
      </section>
    </main>
  );
}
