import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { serverEnv } from "@/lib/env";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe-token";

export const metadata: Metadata = {
  title: "Berhenti menerima pengingat",
  robots: { index: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Where the unsubscribe link in a reminder email lands (Prompt 5.4). Works
 * without signing in. Opening it changes nothing: the button does, so link
 * scanners in mail services cannot switch reminders off by visiting it.
 */
export default async function UnsubscribePage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (first(params.selesai) === "1") {
    return (
      <Notice title="Pengingat dimatikan">
        Kamu tidak akan menerima email pengingat review lagi. Menyalakannya lagi bisa
        kapan saja dari Pengaturan.
      </Notice>
    );
  }

  const userId = first(params.u);
  const token = first(params.t);
  const secret = serverEnv().CRON_SECRET;
  const valid =
    first(params.gagal) !== "1" &&
    Boolean(secret) &&
    verifyUnsubscribeToken(userId, token, secret ?? "");

  if (!valid) {
    return (
      <Notice title="Tautan tidak bisa dipakai">
        Tautannya tidak lengkap atau sudah tidak berlaku. Kamu tetap bisa mematikan
        pengingat dari Pengaturan setelah masuk.
      </Notice>
    );
  }

  return (
    <Sheet as="section" className="stack gap-4 text-center items-center">
      <Icon icon={BellOff} size={36} className="state-icon" />
      <h2 className="text-xl">Berhenti menerima pengingat?</h2>
      <p className="text-secondary text-sm">
        Email pengingat hanya datang pada hari sebuah review jatuh tempo, paling banyak
        sekali sehari.
      </p>
      <form
        method="post"
        action="/api/reminders/unsubscribe"
        className="stack gap-2 w-full"
      >
        <input type="hidden" name="u" value={userId} />
        <input type="hidden" name="t" value={token} />
        <Button type="submit" variant="secondary" block icon={BellOff}>
          Matikan pengingat
        </Button>
      </form>
      <Link href="/" className="text-link text-sm">
        Biarkan menyala
      </Link>
    </Sheet>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Sheet as="section" className="stack gap-4 text-center items-center">
      <Icon icon={BellOff} size={36} className="state-icon" />
      <h2 className="text-xl">{title}</h2>
      <p className="text-secondary text-sm">{children}</p>
      <Link href="/login" className="text-link text-sm">
        Masuk ke Feynman Challenge
      </Link>
    </Sheet>
  );
}
