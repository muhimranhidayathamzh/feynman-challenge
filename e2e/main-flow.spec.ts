import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { USER_FILE } from "./env";

// The main flow from the plan (Prompt 4.3), in order: each step builds on the
// last, so it is one test with named steps rather than several that would
// have to share state. Gemini is mocked (AI_MOCK=1, src/lib/ai/mock.ts): the
// outline has three points and every evaluation scores 7 /10 with point 3
// missing.

function credentials(): { email: string; password: string } {
  return JSON.parse(readFileSync(USER_FILE, "utf8")) as {
    email: string;
    password: string;
  };
}

async function signIn(page: Page): Promise<void> {
  const { email, password } = credentials();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

test("alur utama: buat, rekam, nilai, pelajari lagi, riwayat, pertanyaan lanjutan", async ({
  page,
}) => {
  await test.step("masuk", async () => {
    await signIn(page);
  });

  await test.step("buat tantangan", async () => {
    await page.goto("/challenge/new");
    await page.getByLabel("Apa yang ingin kamu pahami?").fill("Cara kerja antrean");
    await page.getByRole("button", { name: "Susun rencana belajar" }).click();
    await expect(page.getByRole("heading", { name: "Rencana belajar" })).toBeVisible();
    await page.getByRole("button", { name: "Simpan tantangan" }).click();
    await page.waitForURL(/\/challenge\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Gambaran besar")).toBeVisible();
  });

  await test.step("ubah outline: tambah satu poin", async () => {
    await page.getByRole("button", { name: "Ubah", exact: true }).click();
    await page.getByLabel("Poin outline baru").fill("Kapan antrean macet");
    await page.getByRole("button", { name: "Tambah" }).click();
    await expect(page.getByText("Kapan antrean macet")).toBeVisible();
    await page.getByRole("button", { name: "Selesai", exact: true }).click();
  });

  await test.step("rekam 20 detik, dengarkan, kirim", async () => {
    await page.getByRole("link", { name: "Jelaskan sekarang" }).click();
    await page.waitForURL(/\/record$/);
    // Hints for the new point are generated first; the button waits for them.
    const start = page.getByRole("button", { name: "Mulai merekam" });
    await expect(start).toBeEnabled({ timeout: 30_000 });
    await start.click();
    await page.waitForTimeout(20_000);
    await page.getByRole("button", { name: "Selesai" }).click();
    await expect(page.getByRole("button", { name: "Kirim untuk dinilai" })).toBeEnabled();
    await page.getByRole("button", { name: "Kirim untuk dinilai" }).click();
  });

  await test.step("hasil tampil dengan coverage", async () => {
    await page.waitForURL(/\/result\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Percobaan #1")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/\/10/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Yang kamu jelaskan" })).toBeVisible();
  });

  const resultUrl = page.url();

  await test.step("Pelajari lagi menyorot poin yang tepat", async () => {
    // Point 3 ("Contoh sehari-hari") is the one the mock marks missing.
    await page.getByRole("link", { name: "Pelajari lagi: Contoh sehari-hari" }).click();
    await page.waitForURL(/#outline-/);
    const target = decodeURIComponent(new URL(page.url()).hash.slice(1));
    const point = page.locator(`[id="${target}"]`);
    await expect(point).toHaveClass(/is-highlighted/);
    await expect(point).toContainText("Contoh sehari-hari");
  });

  await test.step("riwayat percobaan membuka hasilnya", async () => {
    const row = page.locator(".history-row").first();
    await expect(row).toContainText("#1");
    await expect(row).toContainText("/10");
    await row.click();
    await page.waitForURL(resultUrl);
  });

  await test.step("jawab pertanyaan lanjutan", async () => {
    await page.getByRole("button", { name: "Jawab", exact: true }).first().click();
    await page.getByRole("button", { name: "Mulai rekam jawaban" }).click();
    await page.waitForTimeout(5_000);
    await page.getByRole("button", { name: "Selesai", exact: true }).click();
    await page.getByRole("button", { name: "Kirim jawaban" }).click();
    await expect(page.getByText("Sebagian").first()).toBeVisible({ timeout: 30_000 });
  });
});

test("offline: navigasi tanpa jaringan menampilkan /offline", async ({
  page,
  context,
}) => {
  await signIn(page);
  // The worker registers after load in production builds; wait until it
  // controls the page, then cut the network.
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, {
    timeout: 30_000,
  });
  await context.setOffline(true);
  await page.goto("/pengaturan").catch(() => undefined);
  await expect(page.getByRole("heading", { name: "Kamu sedang offline" })).toBeVisible();
  await context.setOffline(false);
});
