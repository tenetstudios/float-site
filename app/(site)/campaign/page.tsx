import { PatternDivider } from "@/components/pattern-divider";
import { PageIntro, CampaignSection, ReleaseCTA } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Free Campaign", "/campaign", "Take on Float’s free single-player campaign, optional Hard Mode, mastery objectives, and a campaign-only BIG BOSS Balloon.");
export default function CampaignPage() {
  return <><PageIntro label="Campaign" title="Your wall. Your frogs. Your enormous problem."><p>The free single-player campaign takes you from your first defense to a final encounter with something much, much bigger.</p></PageIntro><PatternDivider /><CampaignSection /><PatternDivider /><ReleaseCTA /></>;
}
