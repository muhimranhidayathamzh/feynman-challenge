// ============================================================================
// AudioRecorder — thin wrapper around MediaRecorder + getUserMedia.
// Browser-only (no SSR access at module load). Output: WebM/Opus on
// Chrome/Firefox, MP4 fallback on Safari.
// ============================================================================

export type RecorderErrorCode =
  "permission-denied" | "no-microphone" | "unsupported" | "unknown";

export interface RecorderError {
  code: RecorderErrorCode;
  message: string;
}

/** Type guard + factory for our structured recorder errors. */
export function isRecorderError(value: unknown): value is RecorderError {
  return (
    typeof value === "object" && value !== null && "code" in value && "message" in value
  );
}

function recorderError(code: RecorderErrorCode, message: string): RecorderError {
  return { code, message };
}

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] as const;

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private selectedMimeType = "";

  /** First MediaRecorder-supported mime type, or "" to let the browser decide. */
  static getSupportedMimeType(): string {
    if (typeof MediaRecorder === "undefined") {
      throw recorderError("unsupported", "Browser ini tidak mendukung perekaman audio.");
    }
    for (const candidate of MIME_CANDIDATES) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    }
    return "";
  }

  /** The mime type chosen for the current/last recording. */
  get mimeType(): string {
    return this.selectedMimeType;
  }

  /** Active microphone stream (used by the waveform visualizer). */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /** Requests microphone access and begins recording. */
  async start(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw recorderError("unsupported", "Browser ini tidak mendukung perekaman audio.");
    }

    this.selectedMimeType = AudioRecorder.getSupportedMimeType();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      throw this.mapGetUserMediaError(error);
    }

    this.chunks = [];
    // 32 kbps Opus is plenty for speech and keeps a 10-minute take ~2.5 MB,
    // well under the bucket's 10 MB limit.
    const options: MediaRecorderOptions = {
      audioBitsPerSecond: 32_000,
      ...(this.selectedMimeType ? { mimeType: this.selectedMimeType } : {}),
    };
    this.recorder = new MediaRecorder(this.stream, options);

    this.recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Timeslice so chunks flush periodically (more robust than a single blob).
    this.recorder.start(1000);
  }

  pause(): void {
    if (this.recorder?.state === "recording") {
      this.recorder.pause();
    }
  }

  resume(): void {
    if (this.recorder?.state === "paused") {
      this.recorder.resume();
    }
  }

  /** Stops recording and resolves with the assembled audio blob. */
  stop(): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const recorder = this.recorder;
      if (!recorder || recorder.state === "inactive") {
        reject(recorderError("unknown", "Tidak ada rekaman yang sedang berjalan."));
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.selectedMimeType || "audio/webm",
        });
        this.stopTracks();
        resolve(blob);
      };

      recorder.stop();
    });
  }

  /** Builds a blob from whatever has been captured so far (or null if empty). */
  getBlob(): Blob | null {
    if (this.chunks.length === 0) return null;
    return new Blob(this.chunks, {
      type: this.selectedMimeType || "audio/webm",
    });
  }

  /** Stops everything and releases resources. Safe to call multiple times. */
  dispose(): void {
    if (this.recorder) {
      this.recorder.ondataavailable = null;
      this.recorder.onstop = null;
      if (this.recorder.state !== "inactive") {
        try {
          this.recorder.stop();
        } catch {
          // already stopped — ignore
        }
      }
      this.recorder = null;
    }
    this.stopTracks();
    this.chunks = [];
  }

  private stopTracks(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
  }

  private mapGetUserMediaError(error: unknown): RecorderError {
    const name = error instanceof DOMException ? error.name : "";
    switch (name) {
      case "NotAllowedError":
      case "SecurityError":
        return recorderError(
          "permission-denied",
          "Izin mikrofon ditolak. Aktifkan akses mikrofon untuk merekam.",
        );
      case "NotFoundError":
      case "DevicesNotFoundError":
        return recorderError(
          "no-microphone",
          "Mikrofon tidak ditemukan. Sambungkan mikrofon lalu coba lagi.",
        );
      default:
        return recorderError("unknown", "Gagal mengakses mikrofon. Coba lagi.");
    }
  }
}
