import { Hero, GameSideSection, CampaignSection, MultiplayerSection, UnitShowcase, TrailerSection, ReleaseCTA } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Float — Frogs Defend. Lions Ascend.", "/");
export default function Home() {
  return <><Hero /><div className="dispatch"><span>A frog-vs-lion strategy game</span><span>Small frogs. Enormous problems.</span><span>By Tenet Studios</span></div><GameSideSection /><CampaignSection /><MultiplayerSection /><UnitShowcase /><TrailerSection /><ReleaseCTA /></>;
}
