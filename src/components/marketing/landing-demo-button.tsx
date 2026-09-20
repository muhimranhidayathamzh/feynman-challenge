"use client";

import { useState } from "react";

import { DemoButton } from "@/components/auth/demo-button";

/** "Coba tanpa akun" on the landing page, with room for its error message. */
export function LandingDemoButton() {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="stack gap-2 items-center">
      <DemoButton onError={setError} />
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
