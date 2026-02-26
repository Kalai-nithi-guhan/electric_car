"use client";

import { useState } from "react";

export default function SignInPage() {
  const [role, setRole] = useState("owner");
  const isOwner = role === "owner";

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
        <p className="mt-1 text-sm text-slate-600">
          UI-only authentication for owner and driver.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Choose Role</h2>
        <form className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="owner">Owner</option>
              <option value="driver">Driver</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            {isOwner ? "Email" : "Phone or ID"}
            <input
              type={isOwner ? "email" : "text"}
              placeholder={isOwner ? "owner@fleet.com" : "DR-0098"}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            {isOwner ? "Password" : "PIN"}
            <input
              type="password"
              placeholder={isOwner ? "••••••••" : "••••"}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Continue to {isOwner ? "Owner" : "Driver"} View
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-500">
        Authentication is a frontend-only placeholder in this MVP.
      </p>
    </section>
  );
}
