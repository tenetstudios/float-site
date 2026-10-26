import Link from "next/link";
import { PageIntro } from "@/components/game-sections";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Delete your Float account", "/delete-account", "Request deletion of your Float account and associated personal data from TENET STUDIOS INC.");

const requestUrl = "mailto:contact@tenetstudios.ca?subject=" + encodeURIComponent("Float account deletion request") + "&body=" + encodeURIComponent("Please delete my Float account and associated personal data.\n\nAccount email address: \nFloat username (if known): \n");

export default function DeleteAccountPage() {
  return <>
    <PageIntro label="Account and data deletion" title="Delete your Float account">
      <p>Request deletion of your Float account and associated personal data. Float is operated by TENET STUDIOS INC.</p>
    </PageIntro>
    <div className="legal-content">
      <section>
        <h2>Request account deletion</h2>
        <p><a href={requestUrl}>Email an account deletion request</a> to <a href="mailto:contact@tenetstudios.ca">contact@tenetstudios.ca</a>.</p>
        <p>Send the email from the address associated with your Float account. Use the subject “Float account deletion request” and include your account email address and, if known, your Float username. If the button does not open an email app, copy the address into your email service and send the request there.</p>
        <p>You do not need to install Float or sign in to this website. If you no longer have access to your account email, contact the same address and explain this so we can help verify ownership. Never send your password, verification codes, or payment-card details.</p>
      </section>
      <section>
        <h2>What happens next</h2>
        <p>We may need to verify that you own the account before processing the request. Our support team will respond by email about verification and completion. Opening the email link does not submit a request; you must send the email. Deletion is permanent and removes access to the account.</p>
      </section>
      <section>
        <h2>Data covered by your request</h2>
        <p>Your request covers the Float sign-in account and associated personal data, including profile information, cloud saves and progress, community content, and account-linked game records. Tell us if you also want personal data deleted without closing your account; we will explain what can be removed and whether this affects a feature.</p>
      </section>
      <section>
        <h2>Records that may be retained</h2>
        <p>As described in our privacy policy, some transaction records, match history, and installation statistics may remain detached from the deleted account. Records needed for legal or accounting obligations, security, fraud prevention, or resolving disputes may be retained for those purposes. Backups and provider logs remain subject to their applicable retention periods. Retention varies by record and purpose; contact us for details about records applicable to your request. We do not promise that every retained record is anonymous or that all copies disappear immediately.</p>
      </section>
      <section>
        <h2>Subscriptions and data on your device</h2>
        <p>Deleting your Float account does not cancel an Apple App Store or Google Play subscription. Manage or cancel subscriptions separately in the store where you purchased them. You can still submit a deletion request using the email address above.</p>
        <p>Local saves and preferences on your device must be removed separately by clearing the app’s storage or removing the app and its data. Account deletion does not delete your Google or Apple account.</p>
        <p>Read the <Link href="/privacy">Float Privacy Policy</Link> for more information.</p>
      </section>
    </div>
  </>;
}
