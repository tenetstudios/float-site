import { InformationPage } from "@/components/information-page";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("About", "/about");
export default function AboutPage() {
  return <InformationPage label="About" title="About Float" intro="Float is a frog-vs-lion strategy game made by Tenet Studios." sections={[{ title: "The game", body: "Build your defense. Launch your balloons. Float features a free campaign and multiplayer." }]} />;
}
