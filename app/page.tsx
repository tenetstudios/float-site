import { Hero, SituationStrip, ThisIsFloat, GameSideSection, CampaignSection, MultiplayerSection, UnitShowcase, ClassifiedThreat, TrailerSection, ReleaseCTA } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Float — Frogs Defend. Lions Ascend.", "/");
export default function Home() {
  return <><Hero /><SituationStrip /><ThisIsFloat /><GameSideSection /><CampaignSection /><MultiplayerSection /><UnitShowcase /><ClassifiedThreat /><TrailerSection /><ReleaseCTA /></>;
}
