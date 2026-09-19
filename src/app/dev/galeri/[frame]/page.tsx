import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findFrame } from "../frame-list";
import { GalleryFrame } from "../gallery-frame";

type PageProps = { params: Promise<{ frame: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { frame } = await params;
  return {
    title: `Galeri: ${findFrame(frame)?.title ?? frame}`,
    robots: { index: false, follow: false },
  };
}

/** One gallery screen at full size (development only). */
export default async function GalleryFramePage({ params }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound();
  const { frame } = await params;
  if (!findFrame(frame)) notFound();
  return <GalleryFrame id={frame} />;
}
