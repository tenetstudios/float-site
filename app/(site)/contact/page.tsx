import { InformationPage } from "@/components/information-page";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Contact", "/contact", "Official contact information for Float and Tenet Studios is coming soon.");
export default function ContactPage() {
  return <InformationPage label="Contact" title="Say hello. Soon." intro="Float is made by Tenet Studios. Official contact channels are being prepared." sections={[{ title: "Player support", body: "Support contact details will be published here when available." }, { title: "Press and other enquiries", body: "A verified contact for press, creators, and general enquiries will be added here." }]} />;
}
