import { PatternDivider } from "@/components/pattern-divider";
import { PageIntro, CampaignSection, ReleaseCTA } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Free Campaign", "/campaign", "Take on Float’s free single-player campaign, optional Hard Mode, mastery objectives, and a campaign-only BIG BOSS Balloon.");
export default function CampaignPage() {
  return <><PageIntro label="Campaign" title="Two sides. One sky."><p>Fight through a free single-player campaign as both <strong>Frogs and Lions</strong>—build defenses, launch balloons, unlock new units, and escalate toward a final encounter neither side is particularly prepared for.</p></PageIntro><PatternDivider /><CampaignSection /><PatternDivider /><ReleaseCTA /></>;
}
