/**
 * VISION document matcher. The SDK adapter writes VISION docs with
 * `title="VISION.md"` but derives `key=title.toLowerCase().replace(/\s+/g,"-").replace(/\.md$/i,"")`
 * so the stored key is `"vision"`, not `"VISION.md"`. Historical docs created
 * outside Compass (e.g. founder-authored in the Paperclip UI) commonly use
 * `title="Company Vision"` with `key="vision"` as well. All read paths must
 * accept these shapes; do not strict-match on `"VISION.md"`.
 */
export function isVisionDoc(d: { key?: string; title?: string } | undefined | null): boolean {
  if (!d) return false;
  const key = (d.key || "").toLowerCase();
  const title = (d.title || "").toLowerCase();
  if (key === "vision" || key === "vision.md") return true;
  if (title === "vision.md" || title === "vision" || title === "company vision") return true;
  return false;
}
