import { JsonLd } from "@/components/site/JsonLd";
import { LandingPage } from "@/components/site/LandingPage";
import { SITE_LINKS } from "@/data/site-links";
import { GITHUB_REPO, siteUrl } from "@/lib/site-url";

export default function Home() {
  const origin = siteUrl();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "Petassist",
              alternateName: ["ぺたしすと", "Petassist"],
              url: origin,
              inLanguage: ["en", "ja"],
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${origin}/links?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "SoftwareApplication",
              name: "Petassist",
              alternateName: "ぺたしすと",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "macOS",
              description:
                "Stickable AI agents on the desk — so you can manage the work. Research only, drafts only, this folder only.",
              url: origin,
              codeRepository: GITHUB_REPO,
            },
            {
              "@type": "ItemList",
              name: "Petassist links",
              numberOfItems: SITE_LINKS.length,
              itemListElement: SITE_LINKS.map((link, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: link.title.en,
                url: link.href.startsWith("http")
                  ? link.href
                  : `${origin}${link.href}`,
              })),
            },
          ],
        }}
      />
      <LandingPage />
    </>
  );
}
