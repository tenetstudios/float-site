import { Footer } from "@/components/site-shell";
import { PortalHero, ModeDoors, GameGlimpse, PortalCinematic, PortalRelease } from "@/components/home-portal";
import { pageMetadata } from "@/lib/site";
import "./portal.css";
export const metadata = pageMetadata("Float — Build. Defend. Ascend.", "/");
export default function Home() {
  return <div className="float-portal"><main id="main"><PortalHero /><ModeDoors /><GameGlimpse /><PortalCinematic /><PortalRelease /></main><Footer /></div>;
}
