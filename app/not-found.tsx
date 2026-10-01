import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="panel p-6">
        <h1 className="text-3xl font-semibold">That path is not on the town map.</h1>
        <p className="mt-3 text-ink-soft">The mission link may be old. The three practice missions are waiting on the town screen.</p>
        <Link href="/" className="mt-5 inline-flex min-h-12 items-center rounded-full border-2 border-ink bg-sun px-5 font-extrabold">
          Back to town
        </Link>
      </div>
    </main>
  );
}
