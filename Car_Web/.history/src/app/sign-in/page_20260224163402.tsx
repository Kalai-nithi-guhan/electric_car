export default function SignInPage() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
        <p className="mt-1 text-sm text-slate-600">
          UI-only authentication for owner and driver.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Owner Sign In</h2>
          <form className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                placeholder="owner@fleet.com"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                placeholder="••••••••"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Continue to Owner View
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Driver Sign In</h2>
          <form className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Phone or ID
              <input
                type="text"
                placeholder="DR-0098"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              PIN
              <input
                type="password"
                placeholder="••••"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Continue to Driver View
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Authentication is a frontend-only placeholder in this MVP.
      </p>
    </section>
  );
}
