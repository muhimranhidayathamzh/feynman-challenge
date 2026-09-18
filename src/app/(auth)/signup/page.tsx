import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import { getAuthFeatures } from "@/lib/auth/features";

export const metadata: Metadata = { title: "Daftar" };

/** Server wrapper: hides "Daftar dengan Google" while Google is disabled. */
export default async function SignupPage() {
  const features = await getAuthFeatures();
  return <SignupForm googleEnabled={features.google} />;
}
