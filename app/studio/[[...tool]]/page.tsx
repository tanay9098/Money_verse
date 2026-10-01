import type { Metadata } from "next";
import StudioClient from "@/app/studio/[[...tool]]/studio-client";

export const metadata: Metadata = {
  title: "MoneyVerse Studio",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioClient configured={Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)} />;
}
