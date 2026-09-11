import { PageIntro } from "@/components/game-sections";

export function InformationPage({ label, title, intro, sections }: { label: string; title: string; intro: string; sections: { title: string; body: string }[] }) {
  return <><PageIntro label={label} title={title}><p>{intro}</p></PageIntro><div className="legal-content">{sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div></>;
}
