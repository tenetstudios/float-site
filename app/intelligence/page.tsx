import { DossierHero } from "@/components/intelligence/dossier";
import { IntelligenceHeader, SiteFooter } from "@/components/intelligence/shell";
import { pageMetadata } from "@/lib/site";
import "../intelligence.css";

export const metadata = pageMetadata("Lion Intelligence Directorate", "/intelligence", "Lion Intelligence Directorate. Classified archive, file 773-19-042.");

export default function Home() {
  return (
    <div className="intelligence-home">
      <main id="main" className="intelligence-main">
        <IntelligenceHeader />
        <DossierHero />
      </main>
      <SiteFooter />
    </div>
  );
}
