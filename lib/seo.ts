export const siteSeo = {
  name: "OhioismQuant",
  url: "https://ohioismquant.vip/",
  title: "Polymarket Trading Bot Course | OhioismQuant",
  description:
    "Build a Polymarket trading bot with 50 private lessons in market making, arbitrage, execution, and risk. Basic $499. Pro videos + course source $999.",
};

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteSeo.url}#organization`,
      name: siteSeo.name,
      url: siteSeo.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteSeo.url}ohioismquant-logo.png`,
        width: 400,
        height: 400,
      },
      sameAs: ["https://x.com/0xohioism"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteSeo.url}#website`,
      name: siteSeo.name,
      url: siteSeo.url,
      inLanguage: "en",
      publisher: { "@id": `${siteSeo.url}#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${siteSeo.url}#webpage`,
      name: siteSeo.title,
      description: siteSeo.description,
      url: siteSeo.url,
      inLanguage: "en",
      isPartOf: { "@id": `${siteSeo.url}#website` },
      mainEntity: { "@id": `${siteSeo.url}#course` },
    },
    {
      "@type": "Course",
      "@id": `${siteSeo.url}#course`,
      name: "Polymarket Trading Bot Course",
      description:
        "A private, 50-lesson program for traders and builders studying Polymarket market making and arbitrage, market data, execution, and risk controls.",
      url: `${siteSeo.url}#program`,
      provider: { "@id": `${siteSeo.url}#organization` },
      inLanguage: "en",
      educationalLevel: "Intermediate",
      teaches: ["Market making", "Arbitrage", "Market data", "Trading execution", "Risk controls"],
      audience: { "@type": "Audience", audienceType: "Traders and builders" },
      offers: [
        {
          "@type": "Offer",
          name: "Basic video course",
          description: "50 private video lessons covering market making and arbitrage. Course source code is not included.",
          price: 499,
          priceCurrency: "USD",
          url: `${siteSeo.url}#pricing`,
          seller: { "@id": `${siteSeo.url}#organization` },
        },
        {
          "@type": "Offer",
          name: "Pro videos and course code",
          description: "The Basic video course plus course source code and lab materials.",
          price: 999,
          priceCurrency: "USD",
          url: `${siteSeo.url}#pricing`,
          seller: { "@id": `${siteSeo.url}#organization` },
        },
      ],
    },
  ],
};
