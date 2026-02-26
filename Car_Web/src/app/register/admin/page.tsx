"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterAdminPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    existingAdminPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.existingAdminPassword) {
      setError("Existing admin password is required to create a new admin account");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          existing_admin_password: formData.existingAdminPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      // After successful registration, redirect to login
      router.push("/sign-in?registered=true&role=admin");
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Registration</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a new admin account. Requires existing admin password for security.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          <strong>Security Notice:</strong> You need an existing admin&apos;s password to create a new admin account.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Username *
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email *
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Phone *
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              New Password *
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Confirm Password *
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700">
              Existing Admin Password *
              <input
                type="password"
                name="existingAdminPassword"
                value={formData.existingAdminPassword}
                onChange={handleChange}
                required
                placeholder="Enter an existing admin's password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Required for security. You must have an existing admin&apos;s password.
              </p>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating admin account..." : "Create Admin Account"}
          </button>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <a href="/sign-in" className="font-medium text-slate-900 hover:underline">
                Sign In
              </a>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
