import { InformationPage } from "@/components/information-page";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "Privacy Policy",
  "/privacy",
  "How TENET STUDIOS INC. handles information for Float and floatgame.io, intended for ages 13 and older."
);

const sections = [
  {
    "title": "Who we are",
    "body": "TENET STUDIOS INC. operates Float and floatgame.io. This policy explains how we handle information when you visit our website, play Float, use an account or online features, or contact us. For privacy questions and requests, email contact@tenetstudios.ca."
  },
  {
    "title": "Age requirement",
    "body": "Float is intended for people aged 13 and older, including its offline modes. Children under 13 must not use Float or create an account. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided information, contact contact@tenetstudios.ca so we can investigate, remove the information as required, and disable the associated account. Where local law requires parental or guardian authorization for a person aged 13 or older, that authorization is also required. This age policy is not a claim that we have verified every player's age."
  },
  {
    "title": "Accounts and information you provide",
    "body": "When you register or sign in, we process your email address, account identifier, authentication information, username, display name, and profile information you choose to provide. If you use a supported third-party sign-in provider, we receive the account information that provider shares for sign-in. We also receive messages and attachments you send to support, community mission content you publish, and feedback or reports you submit."
  },
  {
    "title": "Gameplay and online services",
    "body": "We process campaign progress, saved defenses and missions, gameplay attempts and actions, results, ratings, progression, rewards, virtual currency transactions, and cosmetic ownership to provide the game. Online matches also use connection, queue, timing, and disconnect information. Gameplay records or replays may be checked by the server to validate results and rewards, prevent cheating and abuse, and resolve technical problems. Local saves and preferences are stored on your device; cloud saves and online features send the relevant information to our services. Playing without an account does not necessarily disable technical or usage analytics."
  },
  {
    "title": "Public profiles and community content",
    "body": "Your username, display name, public profile information, ranked statistics, leaderboard entries, and missions you publish may be visible to other players. Other players may also see your in-match actions and selected cosmetics. Do not include private contact details or other sensitive information in public names or mission content. Feedback reports submitted through the reporting feature are handled privately rather than published as public comments."
  },
  {
    "title": "Technical information and analytics",
    "body": "Our services and hosting providers process technical information such as IP addresses, browser or device details, operating system, app version, request timestamps, and error or connection records. Float uses installation and account identifiers, session and gameplay events, and campaign or referral information to understand acquisition, engagement, retention, balance, and performance. Approximate country or region information may come from device locale or network information; it is not precise GPS location. The website uses Vercel Web Analytics to measure website visits and usage."
  },
  {
    "title": "How we use information",
    "body": "We use information to operate accounts and gameplay, sync progress, deliver community and multiplayer features, verify purchases and rewards, provide support, investigate reports, secure our services, prevent fraud and cheating, and improve Float. Where applicable law requires a legal basis, these uses depend on providing the service you request, our legitimate interests in operating and protecting it, legal obligations, or consent where required."
  },
  {
    "title": "Purchases and memberships",
    "body": "Where purchases or memberships are available, Apple App Store or Google Play processes payment, and RevenueCat supports membership verification. We receive transaction identifiers, product and purchase status, entitlement information, and related account records to provide purchases, restore access, and handle refunds or disputes. We do not receive your full payment-card number from the app stores. Feature availability depends on the version and platform you use."
  },
  {
    "title": "Advertising",
    "body": "Advertising through Google AdMob is planned but is not connected in the current Float implementation as of this policy's effective date. Creating an AdMob listing or publishing an app-ads.txt file does not itself send player information to AdMob. Before enabling advertising, we will update this policy to describe the data collected by the released ad integration and the privacy choices available. This policy does not represent that personalized ads, advertising consent controls, or rewarded-ad verification are currently active."
  },
  {
    "title": "Storage, permissions, and communications",
    "body": "Float stores sign-in sessions, preferences, local saves, and identifiers on your device. The website uses session cookies for administrator sign-in. You can manage browser storage and device permissions in your browser or operating-system settings; clearing storage may remove local progress or sign you out. If you contact us by email, your address and message are processed through our email service, Zoho Mail. Any optional notifications will depend on feature availability and your device permissions."
  },
  {
    "title": "Service providers and disclosures",
    "body": "We use providers including Supabase for authentication and database services, Vercel for website hosting and analytics, RevenueCat for supported membership processing, Apple and Google for applicable sign-in or store services, and Zoho Mail for email. We share information with providers as needed for those functions. Public information is shared as described above. We may also disclose information where required by law, to protect users and our services, or in connection with a merger, acquisition, or business transfer subject to applicable privacy protections."
  },
  {
    "title": "International processing and security",
    "body": "Our providers may process information outside your province or country, including in the United States and other places where they operate. Information may be subject to the laws of those locations. We use access restrictions, authenticated services, and other technical and organizational safeguards to protect information, but no system can guarantee absolute security. Contact us if you suspect unauthorized access to your account."
  },
  {
    "title": "Retention and deletion",
    "body": "We retain information for as long as needed to provide the relevant service, maintain your account, resolve disputes, prevent abuse, and meet legal or accounting obligations. Retention depends on the type of information and its purpose. Account deletion removes the account and associated profile, cloud-save, and community records through our deletion process. Some transaction records, match history, and installation statistics may remain detached from the deleted account; backups and provider logs can remain for their applicable retention periods. We do not promise that all retained records are anonymous or that all copies disappear immediately. Local device saves must be removed separately. Deleting a Float account does not cancel an app-store subscription."
  },
  {
    "title": "Your choices and rights",
    "body": "You can edit supported profile fields in the app and request account deletion through My Account when available, or by emailing contact@tenetstudios.ca. Depending on your location, you may have rights to access, correct, delete, or obtain a copy of your personal information, restrict or object to processing, and withdraw consent where processing relies on consent. Contact us to exercise these rights or raise a concern. We may need to verify your identity before acting. You may also complain to your local privacy regulator. Manage or cancel subscriptions through the store where you purchased them."
  },
  {
    "title": "Policy changes and contact",
    "body": "We will publish changes on this page and update the effective date. Where required, we will provide additional notice or request consent for material changes. For questions, privacy requests, or concerns about a child's information, contact TENET STUDIOS INC. at contact@tenetstudios.ca."
  }
];

export default function PrivacyPage() {
  return (
    <InformationPage
      label="Privacy"
      title="Privacy Policy"
      intro="Effective October 12, 2026. Float and floatgame.io are operated by TENET STUDIOS INC. Float is intended for ages 13 and older."
      sections={sections}
    />
  );
}

