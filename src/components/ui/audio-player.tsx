"use client";

interface Props {
  src: string;
  /** Accessible name, e.g. "Rekaman percobaan #3". */
  label: string;
}

/**
 * Native audio controls: keyboard- and screen-reader-accessible out of the box,
 * and the browser picks the right decoder (WebM/Opus, or MP4/AAC on Safari).
 */
export function AudioPlayer({ src, label }: Props) {
  return (
    <audio
      className="audio-player"
      controls
      preload="metadata"
      src={src}
      aria-label={label}
    >
      Browser ini tidak dapat memutar audio.
    </audio>
  );
}
