import { defineConfig, devices } from "@playwright/test";

import { E2E_PORT, e2eEnv } from "./e2e/env";

// End-to-end tests (Prompt 4.3): the production build, Gemini mocked
// (AI_MOCK=1), a fake microphone playing e2e/fixtures/explain.wav, and a
// separate Supabase project for test data. `npm run test:e2e`.
const env = e2eEnv();

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: "retain-on-failure",
    permissions: ["microphone"],
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // The Chrome installed on this machine locally; Playwright's own
        // Chromium in CI (npx playwright install chromium).
        ...(process.env.CI ? {} : { channel: "chrome" }),
        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
            "--use-file-for-fake-audio-capture=e2e/fixtures/explain.wav",
          ],
        },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    // Real process.env wins over .env.local in Next.js, so these replace the
    // main project's values for this build. Empty means "off".
    env: {
      AI_MOCK: "1",
      NEXT_PUBLIC_SUPABASE_URL: env.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.anonKey,
      SUPABASE_SERVICE_ROLE_KEY: env.serviceRoleKey,
      GEMINI_API_KEY: "e2e-mocked",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${E2E_PORT}`,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      NEXT_PUBLIC_SENTRY_DSN: "",
      RESEND_API_KEY: "",
    },
  },
});
