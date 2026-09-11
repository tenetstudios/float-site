import { InformationPage } from "@/components/information-page";
import { pageMetadata } from "@/lib/site";
export const metadata = { ...pageMetadata("Terms of Service", "/terms", "Float terms of service publication status."), robots: { index: false, follow: true } };
export default function TermsPage() {
  return <InformationPage label="Terms" title="Terms of Service" intro="The final terms have not been published. This page is a placeholder and does not establish an agreement." sections={[{ title: "Terms publication", body: "Approved terms and their effective date will be added here before release." }, { title: "Scope of the terms", body: "Final text will set out the applicable conditions for using Float and its related services." }, { title: "Questions about the terms", body: "A verified contact channel will be published alongside the final terms." }]} />;
}
