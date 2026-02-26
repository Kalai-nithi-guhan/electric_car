"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [role, setRole] = useState<"admin" | "driver">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const isAdmin = role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password, role);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
        <p className="mt-1 text-sm text-slate-600">
          Login as {isAdmin ? "Admin (Owner)" : "Driver"} to access your dashboard.
        </p>
      </div>

      {registered && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">
            Registration successful! Please login with your credentials.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Choose Role</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as "admin" | "driver")}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="admin">Admin (Owner)</option>
              <option value="driver">Driver</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isAdmin ? "admin" : "driver username"}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            {isAdmin ? (
              <a href="/register/admin" className="font-medium text-slate-900 hover:underline">
                Register as Admin
              </a>
            ) : (
              <a href="/register" className="font-medium text-slate-900 hover:underline">
                Register as Driver
              </a>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
