"use client";

import React, { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import {
  X,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  Key,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  session: {
    user?: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
  } | null;
}

export function AuthModal({ open, onClose, session }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleQuickSeedAdmin = () => {
    setEmail("admin@harmonic.ai");
    setPassword("admin123");
    setName("Harmonic Admin");
    setErrorMsg(null);
  };

  const handleQuickDemoMember = () => {
    setEmail("sam@harmonic.ai");
    setPassword("user123");
    setName("Sam (Frontend Eng)");
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        name: mode === "register" ? name.trim() || undefined : undefined,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg("Authentication failed. Verify credentials or try demo admin.");
      } else {
        setSuccessMsg(
          mode === "register"
            ? "Identity auto-provisioned! Signed in."
            : "Session authenticated successfully."
        );
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication error";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut({ redirect: false });
      setSuccessMsg("Signed out.");
      setTimeout(() => {
        onClose();
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 sm:p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-zinc-100">
              Identity & Access Console
            </h2>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 focus-visible:outline-none transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is already signed in */}
        {session?.user ? (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-950 rounded border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center font-mono font-bold text-sm text-purple-200">
                {session.user.name
                  ? session.user.name.slice(0, 2).toUpperCase()
                  : "HQ"}
              </div>
              <div className="flex-1 min-w-0 font-mono">
                <div className="text-xs font-semibold text-zinc-100 truncate">
                  {session.user.name || "Authenticated Operator"}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {session.user.email}
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300 uppercase">
                ACTIVE
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded border border-zinc-800/80 space-y-2 text-xs font-mono text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-400" />
                  WORKSPACE
                </span>
                <span className="text-zinc-200">Harmonic Core (harmonic-core)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  ACCESS ROLE
                </span>
                <span className="text-purple-300 font-semibold">
                  {session.user.email?.startsWith("admin") ? "ADMIN" : "MEMBER"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  SESSION ID
                </span>
                <span className="text-zinc-400 text-[10px]">
                  {session.user.id ? session.user.id.slice(0, 12) + "..." : "JWT_OK"}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                id="auth-signout-submit-btn"
                onClick={handleSignOut}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-mono font-medium text-red-300 uppercase tracking-wider instrument-btn transition-colors cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Terminate Session (Sign Out)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div>
            {/* Mode Tabs */}
            <div className="flex border-b border-zinc-800 mb-4 font-mono text-xs">
              <button
                id="auth-mode-signin-btn"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-center border-b-2 transition-colors cursor-pointer ${
                  mode === "signin"
                    ? "border-purple-500 text-purple-300 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                SIGN IN
              </button>
              <button
                id="auth-mode-register-btn"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-center border-b-2 transition-colors cursor-pointer ${
                  mode === "register"
                    ? "border-purple-500 text-purple-300 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                AUTO-PROVISION (SIGN UP)
              </button>
            </div>

            {/* Quick Demo Pre-fill Buttons */}
            <div className="mb-4 p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono">
              <div className="text-zinc-500 mb-1.5 uppercase tracking-wider">
                Instant Provisioning Profiles:
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="quick-fill-admin-btn"
                  onClick={handleQuickSeedAdmin}
                  className="flex-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-purple-800/60 text-purple-300 text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer"
                >
                  ⚡ Admin (admin@harmonic.ai)
                </button>
                <button
                  type="button"
                  id="quick-fill-sam-btn"
                  onClick={handleQuickDemoMember}
                  className="flex-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-cyan-800/60 text-cyan-300 text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer"
                >
                  ⚡ Sam (Frontend Eng)
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 font-mono">
              {mode === "register" && (
                <div>
                  <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                    <input
                      id="auth-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@harmonic.ai"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2 rounded bg-red-950/60 border border-red-800 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs uppercase font-semibold tracking-wider instrument-btn disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>
                  {mode === "signin"
                    ? "Authenticate & Engage Session"
                    : "Auto-Provision & Sign In"}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
