import { Header, Footer } from "@/components/site-shell";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main id="main">{children}</main><Footer /></>;
}
