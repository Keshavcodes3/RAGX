"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "../../components/Logo";
import { ApiError, ragxApi } from "../../lib/ragx-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await ragxApi.login(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Sign in failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-white px-4 font-sans text-[#1D1D1F] antialiased">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="text-[17px] font-semibold tracking-tight">RAGX</span>
        </div>
        <h1 className="mt-8 text-[26px] font-semibold tracking-[-0.02em]">
          Sign in
        </h1>
        <p className="mt-1 text-[15px] text-[#6E6E73]">
          Access your projects and provider configuration.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label htmlFor="email" className="text-[13px] font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#E8E8ED] bg-white px-3 py-2 text-[14px] outline-none transition-colors focus:border-[#1D1D1F]"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-[13px] font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#E8E8ED] bg-white px-3 py-2 text-[14px] outline-none transition-colors focus:border-[#1D1D1F]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[#1D1D1F] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-[#6E6E73]">
          Sessions use an httpOnly cookie. Keys you save later are encrypted
          server-side and never returned by the API.
        </p>
      </div>
    </div>
  );
}
