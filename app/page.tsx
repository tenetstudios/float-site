import { Hero, ThisIsFloat, GameSideSection, CampaignSection, MultiplayerSection, UnitShowcase, TrailerSection, ReleaseCTA } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Float — Frogs Defend. Lions Ascend.", "/");
export default function Home() {
  return <><Hero /><ThisIsFloat /><GameSideSection /><CampaignSection /><MultiplayerSection /><UnitShowcase /><TrailerSection /><ReleaseCTA /></>;
}
