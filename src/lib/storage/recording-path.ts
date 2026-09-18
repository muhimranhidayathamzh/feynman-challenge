// ============================================================================
// Recording storage paths — pure helpers shared by the browser uploader and
// the attempt API. Layout: {user_id}/{challenge_id}/{uuid}.{ext}
// ============================================================================

export const RECORDINGS_BUCKET = "recordings";

export type RecordingExtension = "webm" | "mp4" | "ogg";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const RECORDING_PATH_RE = new RegExp(`^${UUID}/${UUID}/${UUID}\\.(webm|mp4|ogg)$`, "i");
const FOLLOWUP_PATH_RE = new RegExp(
  `^${UUID}/${UUID}/followups/${UUID}\\.(webm|mp4|ogg)$`,
  "i",
);

/** Sub-folder (inside a challenge folder) for Socratic follow-up answers. */
export const FOLLOWUPS_FOLDER = "followups";

/** File extension for a MediaRecorder mime type (defaults to webm). */
export function extensionForMime(mime: string): RecordingExtension {
  const base = mime.toLowerCase();
  if (base.includes("mp4")) return "mp4";
  if (base.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Content type to send to Storage: the base type only. The bucket's
 * allowed_mime_types list does not accept codec parameters such as
 * "audio/webm;codecs=opus".
 */
export function storageContentType(mime: string): string {
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "audio/mp4" || base === "audio/ogg" || base === "audio/webm") return base;
  return `audio/${extensionForMime(mime)}`;
}

/** Content type to hand to Gemini, derived from the stored path. */
export function contentTypeForPath(path: string): string {
  return `audio/${extensionForMime(path.slice(path.lastIndexOf(".") + 1))}`;
}

export function buildRecordingPath(
  userId: string,
  challengeId: string,
  ext: RecordingExtension,
  uuid: string = crypto.randomUUID(),
): string {
  return `${userId}/${challengeId}/${uuid}.${ext}`;
}

/**
 * True when `path` has the exact expected shape AND sits under the caller's
 * own {userId}/{challengeId}/ prefix. Rejects traversal, nesting, and paths
 * pointing at other users' or challenges' folders.
 */
export function isOwnRecordingPath(
  path: string,
  userId: string,
  challengeId: string,
): boolean {
  if (!RECORDING_PATH_RE.test(path)) return false;
  return path.toLowerCase().startsWith(`${userId}/${challengeId}/`.toLowerCase());
}

/** Splits a valid path into its folder and file name (for Storage list/search). */
export function splitRecordingPath(path: string): { folder: string; name: string } {
  const index = path.lastIndexOf("/");
  return { folder: path.slice(0, index), name: path.slice(index + 1) };
}

/** {user}/{challenge}/followups/{uuid}.{ext} for a follow-up answer. */
export function buildFollowupPath(
  userId: string,
  challengeId: string,
  ext: RecordingExtension,
  uuid: string = crypto.randomUUID(),
): string {
  return `${userId}/${challengeId}/${FOLLOWUPS_FOLDER}/${uuid}.${ext}`;
}

/** Same guarantees as isOwnRecordingPath, for the follow-ups sub-folder. */
export function isOwnFollowupPath(
  path: string,
  userId: string,
  challengeId: string,
): boolean {
  if (!FOLLOWUP_PATH_RE.test(path)) return false;
  return path
    .toLowerCase()
    .startsWith(`${userId}/${challengeId}/${FOLLOWUPS_FOLDER}/`.toLowerCase());
}
