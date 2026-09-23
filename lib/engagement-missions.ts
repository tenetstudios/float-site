// Display-only snapshot of float-app packages/session/src/campaign.ts and its mission JSON imports.
// The native engagement adapter identifies this catalog as campaign-v1. Unknown IDs/versions remain unchanged.
const campaignV1: Record<string, string> = {
  "chapter-1-1": "balloons",
  "chapter-1-2": "more balloons",
  "chapter-1-3": "OPERATION ASCENDANT SKY",
  "chapter-2-1": "OPERATION IRON HORIZON",
  "chapter-2-2": "tough balloon",
  "chapter-2-3": "OPERATION SWIFT VICTORY",
  "chapter-3-1": "two balloons",
  "chapter-3-2": "hard wall",
  "chapter-3-3": "OPERATION TWIN THUNDER",
  "chapter-4-1": "OPERATION ECHO STRIKE",
  "chapter-4-2": "long tongue",
  "chapter-4-3": "OPERATION CROSSFIRE",
  "chapter-5-1": "sticky stuff",
  "chapter-5-2": "boom",
  "chapter-5-3": "OPERATION BUNKER APPLE YELLOW SKY",
  "chapter-6-1": "metal balloon",
  "chapter-6-2": "OPERATION CROSSFIRE HURRICANE",
  "chapter-6-3": "OPERATION BREACH POINT",
  "chapter-7-1": "pointy stuff",
  "chapter-7-2": "fat frog",
  "chapter-7-3": "OPERATION EMERGENT TRAJECTORY"
};
export function missionLabel(id: string, version: string) {
  const title = version === "campaign-v1" ? campaignV1[id] : undefined;
  return title ? `${title} (${id})` : id;
}
