import { InformationPage } from "@/components/information-page";
import { pageMetadata } from "@/lib/site";
export const metadata = { ...pageMetadata("Safety", "/safety"), robots: { index: false, follow: true } };
export default function SafetyPage() {
  return <InformationPage label="Safety" title="Player safety" intro="Safety information is being prepared. This page is a publication placeholder." sections={[{ title: "Before release", body: "Approved player safety guidance and verified reporting channels will be published here when available." }]} />;
}
