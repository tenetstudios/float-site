import { PatternDivider } from "@/components/pattern-divider";
import { PageIntro, GameSideSection, UnitShowcase, ReleaseCTA } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("The Game", "/game");
export default function GamePage() {
  return <><PageIntro label="The game" title="A very serious game about a very unserious war."><p>Frogs defend. Lions ascend. Build specialized defenses, reinforce your walls, and launch balloon formations that turn a standoff into siege warfare.</p></PageIntro><PatternDivider /><GameSideSection /><PatternDivider /><UnitShowcase /><PatternDivider /><ReleaseCTA /></>;
}
