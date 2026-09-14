import Link from "next/link";
import { ArtworkSlot } from "@/components/artwork-slot";
import { PageIntro, ReleaseCTA } from "@/components/game-sections";
import { artwork, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Sandbox", "/sandbox", "Build anything. Test everything. See what happens. Explore Float’s free-play Sandbox, coming October 2026.");
export default function SandboxPage() {
  return <><PageIntro label="Sandbox / Free play" title="Build anything. Test everything."><p>Walls, frogs, balloons. Set up your own battlefield and see what happens.</p><p>Supervision not provided.</p></PageIntro><section className="section sandbox-preview" aria-label="Sandbox battlefield"><ArtworkSlot asset={artwork.frogs} sizes="90vw" position="50% 55%" /><p className="caption">Float battlefield artwork / Free-form experimentation</p><Link className="text-link" href="/#modes">Explore all three modes ↗</Link></section><ReleaseCTA /></>;
}
