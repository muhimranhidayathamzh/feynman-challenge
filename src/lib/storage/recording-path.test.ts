import { describe, expect, it } from "vitest";

import {
  buildFollowupPath,
  buildRecordingPath,
  contentTypeForPath,
  extensionForMime,
  isOwnFollowupPath,
  isOwnRecordingPath,
  splitRecordingPath,
  storageContentType,
} from "./recording-path";

const USER = "11111111-1111-4111-8111-111111111111";
const CHALLENGE = "22222222-2222-4222-8222-222222222222";
const FILE = "33333333-3333-4333-8333-333333333333";

describe("mime helpers", () => {
  it("maps MediaRecorder mime types to extensions", () => {
    expect(extensionForMime("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionForMime("audio/mp4")).toBe("mp4");
    expect(extensionForMime("audio/ogg;codecs=opus")).toBe("ogg");
    expect(extensionForMime("")).toBe("webm");
  });

  it("strips codec parameters for the Storage content type", () => {
    expect(storageContentType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(storageContentType("audio/mp4")).toBe("audio/mp4");
    expect(storageContentType("")).toBe("audio/webm");
    expect(storageContentType("video/webm")).toBe("audio/webm");
  });

  it("derives the Gemini content type from the stored path", () => {
    expect(contentTypeForPath(`${USER}/${CHALLENGE}/${FILE}.mp4`)).toBe("audio/mp4");
    expect(contentTypeForPath(`${USER}/${CHALLENGE}/${FILE}.webm`)).toBe("audio/webm");
  });
});

describe("recording paths", () => {
  const path = buildRecordingPath(USER, CHALLENGE, "webm", FILE);

  it("builds the {user}/{challenge}/{uuid}.{ext} layout", () => {
    expect(path).toBe(`${USER}/${CHALLENGE}/${FILE}.webm`);
    expect(splitRecordingPath(path)).toEqual({
      folder: `${USER}/${CHALLENGE}`,
      name: `${FILE}.webm`,
    });
  });

  it("accepts a well-formed path under the caller's own prefix", () => {
    expect(isOwnRecordingPath(path, USER, CHALLENGE)).toBe(true);
    expect(isOwnRecordingPath(path.toUpperCase(), USER, CHALLENGE)).toBe(true);
  });

  it("rejects paths for another user or challenge", () => {
    expect(isOwnRecordingPath(path, CHALLENGE, USER)).toBe(false);
    expect(isOwnRecordingPath(path, USER, FILE)).toBe(false);
  });

  it("rejects malformed, nested, or traversal paths", () => {
    expect(isOwnRecordingPath(`${USER}/${CHALLENGE}/../x.webm`, USER, CHALLENGE)).toBe(
      false,
    );
    expect(
      isOwnRecordingPath(`${USER}/${CHALLENGE}/a/${FILE}.webm`, USER, CHALLENGE),
    ).toBe(false);
    expect(isOwnRecordingPath(`${USER}/${CHALLENGE}/${FILE}.exe`, USER, CHALLENGE)).toBe(
      false,
    );
    expect(isOwnRecordingPath(`${USER}/${CHALLENGE}/${FILE}`, USER, CHALLENGE)).toBe(
      false,
    );
    expect(isOwnRecordingPath("", USER, CHALLENGE)).toBe(false);
  });
});

describe("follow-up paths", () => {
  const path = buildFollowupPath(USER, CHALLENGE, "webm", FILE);

  it("lives in the challenge's followups sub-folder", () => {
    expect(path).toBe(`${USER}/${CHALLENGE}/followups/${FILE}.webm`);
    expect(isOwnFollowupPath(path, USER, CHALLENGE)).toBe(true);
  });

  it("is not accepted as a main recording and vice versa", () => {
    expect(isOwnRecordingPath(path, USER, CHALLENGE)).toBe(false);
    expect(
      isOwnFollowupPath(
        buildRecordingPath(USER, CHALLENGE, "webm", FILE),
        USER,
        CHALLENGE,
      ),
    ).toBe(false);
  });

  it("rejects other users and traversal", () => {
    expect(isOwnFollowupPath(path, CHALLENGE, USER)).toBe(false);
    expect(
      isOwnFollowupPath(
        `${USER}/${CHALLENGE}/followups/../${FILE}.webm`,
        USER,
        CHALLENGE,
      ),
    ).toBe(false);
  });
});
