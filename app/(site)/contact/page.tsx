import { PageIntro } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Player support", "/contact", "Contact Tenet Studios for help with Float.");

export default function ContactPage() {
  return (
    <>
      <PageIntro label="Contact" title="Float player support">
        <p>Need help with Float? Email <a href="mailto:contact@tenetstudios.ca">contact@tenetstudios.ca</a>.</p>
      </PageIntro>
      <div className="legal-content">
        <section>
          <h2>Report a problem</h2>
          <p>Tell us what happened and which device you were playing on. If the issue happened during a mission, include the mission name so we can find it.</p>
        </section>
      </div>
    </>
  );
}
