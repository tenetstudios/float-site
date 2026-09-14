import { PatternDivider } from "@/components/pattern-divider";
import { PageIntro, MultiplayerSection, ReleaseCTA } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Multiplayer", "/multiplayer", "Build your defense and launch your attack in Float multiplayer. A frog-vs-lion rivalry coming October 2026.");
export default function MultiplayerPage() {
  return <><PageIntro label="Multiplayer" title="Outbuild. Outlaunch. Outthink."><p>A good defense is only half the argument. Bring your strategy to multiplayer and see how it holds up on both sides of the wall.</p></PageIntro><PatternDivider /><MultiplayerSection /><PatternDivider /><ReleaseCTA /></>;
}
