import { InformationPage } from "@/components/information-page";
import { pageMetadata } from "@/lib/site";
export const metadata = { ...pageMetadata("Privacy Policy", "/privacy", "Float privacy policy publication status."), robots: { index: false, follow: true } };
export default function PrivacyPage() {
  return <InformationPage label="Privacy" title="Privacy Policy" intro="The final privacy policy has not been published. This page is a placeholder, not an active policy." sections={[{ title: "Policy publication", body: "The approved policy will be added here before release, with its effective date." }, { title: "What the policy will cover", body: "Final text will explain applicable data practices, service providers, retention, and privacy choices for the website and game." }, { title: "Privacy contact", body: "A verified channel for privacy questions will be published with the final policy." }]} />;
}
