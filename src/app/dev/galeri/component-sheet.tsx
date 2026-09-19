"use client";

import { Plus, Send } from "lucide-react";

import { LeitnerStrip } from "@/components/challenge/leitner-strip";
import { MasteryMeter } from "@/components/challenge/mastery-meter";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { CoverageMark } from "@/components/evaluation/coverage-mark";
import { ScoreFigure } from "@/components/evaluation/score-figure";
import { SubScoreBars } from "@/components/evaluation/sub-score-bars";
import { HintChip } from "@/components/recording/hint-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import { weekStrip } from "@/lib/utils/streak";
import type { CoverageStatus, MasteryState } from "@/types";

import { TODAY } from "./fixtures";

const MASTERY: MasteryState[] = [
  "not_started",
  "attempted",
  "developing",
  "proficient",
  "mastered",
  "solidified",
];
const COVERAGE: CoverageStatus[] = ["covered", "partial", "missing"];
const noop = () => undefined;

/** Every primitive and learning component in all its states (V.3). */
export function ComponentSheet() {
  return (
    <main className="page">
      <h1>Komponen</h1>

      <Sheet className="stack gap-4">
        <SheetTitle>Tombol</SheetTitle>
        <div className="row flex-wrap gap-3">
          <Button icon={Send}>Utama</Button>
          <Button variant="secondary">Sekunder</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Hapus</Button>
          <Button disabled>Nonaktif</Button>
          <Button loading>Memuat</Button>
        </div>
        <div className="row flex-wrap items-center gap-3">
          <Button size="sm" icon={Plus}>
            Kecil
          </Button>
          <Button size="lg">Besar</Button>
        </div>
      </Sheet>

      <Sheet className="stack gap-4">
        <SheetTitle>Formulir</SheetTitle>
        <Field id="g-topik" label="Apa yang ingin kamu kuasai?" hint="Satu topik.">
          <Input placeholder="mis. Fotosintesis" />
        </Field>
        <Field id="g-salah" label="Email" error="Alamat email tidak valid.">
          <Input defaultValue="rani@" />
        </Field>
        <Field id="g-zona" label="Zona waktu">
          <Select defaultValue="Asia/Jakarta">
            <option>Asia/Jakarta</option>
            <option>Asia/Makassar</option>
          </Select>
        </Field>
        <Field id="g-catatan" label="Catatan">
          <Textarea defaultValue="Daun itu dapur bertenaga surya." />
        </Field>
      </Sheet>

      <Sheet className="stack gap-4">
        <SheetTitle>Label dan pesan</SheetTitle>
        <div className="row flex-wrap gap-2">
          <Badge>Netral</Badge>
          <Badge tone="success">Tercakup</Badge>
          <Badge tone="warning">Terlewat</Badge>
          <Badge tone="accent">Baru</Badge>
          <Badge tone="error">Error sistem</Badge>
        </div>
        <div className="alert alert-success">Kata sandi disimpan.</div>
        <div className="alert alert-error">Gagal menyimpan. Coba lagi.</div>
        <nav className="tabs" aria-label="Contoh tab">
          <a className="tab" aria-current="page" href="#">
            Aktif <span className="tab-count">4</span>
          </a>
          <a className="tab" href="#">
            Istirahat <span className="tab-count">1</span>
          </a>
        </nav>
      </Sheet>

      <Sheet className="stack gap-4">
        <SheetTitle>Skor dan cakupan</SheetTitle>
        <div className="row flex-wrap gap-8">
          <ScoreFigure score={7} previous={{ score: 6, attemptNumber: 1 }} />
          <ScoreFigure score={9} max={9} previous={{ score: 9, attemptNumber: 3 }} />
          <ScoreFigure score={3} />
        </div>
        <SubScoreBars
          items={[
            { label: "Kelengkapan", value: 6 },
            { label: "Akurasi", value: 8 },
            { label: "Kejelasan", value: 7 },
          ]}
        />
        <ul className="stack gap-2">
          {COVERAGE.map((status) => (
            <li key={status} className="row gap-2 items-center">
              <CoverageMark status={status} decorative />
              <span>{COVERAGE_STATUS_LABEL[status]}</span>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet className="stack gap-4">
        <SheetTitle>Penguasaan dan review</SheetTitle>
        <div className="stack gap-3">
          {MASTERY.map((state) => (
            <div key={state} className="row flex-wrap gap-6 items-center">
              <MasteryMeter state={state} />
              <MasteryMeter state={state} compact />
            </div>
          ))}
        </div>
        <LeitnerStrip box={2} nextReview="Review berikutnya: 22 Sep" />
        <WeekStrip days={weekStrip(TODAY, TODAY, 4)} streak={4} />
        <WeekStrip days={weekStrip(TODAY, null, 0)} streak={0} />
      </Sheet>

      <Sheet className="stack gap-4">
        <SheetTitle>Petunjuk</SheetTitle>
        <div className="row flex-wrap gap-2">
          <HintChip label="Kata kunci" cap={9} revealed onReveal={noop} />
          <HintChip label="Pertanyaan" cap={8} revealed={false} onReveal={noop} />
          <HintChip label="Outline" cap={7} revealed={false} onReveal={noop} disabled />
        </div>
      </Sheet>

      <div className="dashboard-grid">
        <Sheet>
          <EmptyState illustration="meja-kosong" title="Mejamu masih kosong">
            <p>Pilih satu topik yang ingin kamu kuasai.</p>
          </EmptyState>
        </Sheet>
        <Sheet>
          <EmptyState illustration="catatan-kosong" title="Belum ada catatan">
            <p>Tulis ringkasan dengan kata-katamu sendiri.</p>
          </EmptyState>
        </Sheet>
        <Sheet>
          <EmptyState illustration="offline" title="Kamu sedang offline">
            <p>Sambungkan lagi internetmu.</p>
          </EmptyState>
        </Sheet>
        <Sheet>
          <EmptyState illustration="error" title="Ada yang tidak beres">
            <p>Kesalahannya ada di pihak kami.</p>
          </EmptyState>
        </Sheet>
      </div>
    </main>
  );
}
