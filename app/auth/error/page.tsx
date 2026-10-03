import Link from "next/link";

const messages: Record<string, string> = {
  Configuration: "Google sign-in is missing its server configuration.",
  AccessDenied: "Google did not confirm this sign-in.",
  Verification: "The sign-in check did not match. Please try again.",
  OAuthSignin: "Google sign-in could not start.",
  OAuthCallback: "Google did not finish signing in.",
  OAuthAccountNotLinked: "This Google account could not be linked.",
  Callback: "The sign-in callback did not complete.",
  Default: "Google sign-in did not finish.",
};

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const code = params.error && messages[params.error] ? params.error : "Default";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-4 py-16">
      <section className="panel p-6">
        <p className="text-sm font-extrabold uppercase tracking-wide text-leaf">Sign-in</p>
        <h1 className="mt-2 text-4xl font-semibold">Google sign-in did not finish</h1>
        <p className="mt-3 text-lg text-ink-soft">{messages[code]}</p>
        <p className="mt-3 text-ink-soft">The town is still available without an account. Progress made while signed out stays on this device.</p>
        <Link href="/" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ink bg-sun px-5 font-extrabold">
          Back to town
        </Link>
      </section>
    </main>
  );
}
