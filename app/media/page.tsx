import { PageIntro, TrailerSection } from "@/components/game-sections";
import { ArtworkSlot } from "@/components/artwork-slot";
import { artwork, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Media", "/media", "Float cinematic, game artwork, and screenshots. Official media coming soon from Tenet Studios.");
export default function MediaPage() {
  return <><PageIntro label="Media" title="Coming into focus."><p>A closer look at the world of Float. The cinematic, official artwork, and screenshots are on their way.</p></PageIntro><TrailerSection /><section className="section"><h2 className="mb-6 text-3xl font-bold tracking-tight">From the battlefield</h2><div className="grid gap-5 md:grid-cols-2"><ArtworkSlot asset={artwork.frogs} label="Frog artwork coming soon" /><ArtworkSlot asset={artwork.lions} label="Lion artwork coming soon" /></div></section></>;
}
