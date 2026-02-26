import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Fleet Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Read-only frontend dashboard for owner analytics and driver status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/sign-in"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
        >
          <h2 className="text-xl font-semibold">Sign In</h2>
          <p className="mt-2 text-sm text-slate-600">
            Owner and driver sign-in screens (frontend-only).
          </p>
        </Link>

        <Link
          href="/owner"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
        >
          <h2 className="text-xl font-semibold">Owner View</h2>
          <p className="mt-2 text-sm text-slate-600">
            Vehicle details, monthly revenue, costs, and analytics overview.
          </p>
        </Link>

        <Link
          href="/driver"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
        >
          <h2 className="text-xl font-semibold">Driver View</h2>
          <p className="mt-2 text-sm text-slate-600">
            Charge remaining, remaining time, and remaining distance (km).
          </p>
        </Link>
      </div>
    </section>
  );
}
