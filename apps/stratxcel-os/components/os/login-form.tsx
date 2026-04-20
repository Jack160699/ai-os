"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const onMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!supabaseConfigured) {
      setMessage("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
      setMessage("Check your email for the sign-in link.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const onPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!supabaseConfigured) {
      setMessage("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(next);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">StratXcel OS</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to continue.</p>
      </div>

      <form className="space-y-4" onSubmit={onMagicLink}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !email}>
          Email me a magic link
        </Button>
      </form>

      <div className="relative py-2 text-center text-xs text-slate-500">
        <span className="relative z-10 bg-[oklch(0.14_0.02_260)] px-2">or password</span>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
      </div>

      <form className="space-y-4" onSubmit={onPassword}>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary" className="w-full" disabled={loading || !email || !password}>
          Sign in with password
        </Button>
      </form>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
