"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="panel p-6">
        <h1 className="text-3xl font-semibold">Pip tripped over a pebble.</h1>
        <p className="mt-3 text-ink-soft">The town screen had a problem. Game coins saved on this device are still there.</p>
        <button type="button" onClick={reset} className="mt-5 min-h-12 rounded-full border-2 border-ink bg-sun px-5 font-extrabold">
          Try again
        </button>
      </div>
    </main>
  );
}
