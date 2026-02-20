/**
 * InTheWild — AI SEO Optimization
 * Automatically bakes SEO optimization into every generated site.
 * Meta tags, structured data, sitemaps, robots.txt, Open Graph, Twitter Cards.
 */

import { openrouterClient } from "./openrouter";

interface SEOConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  keywords: string[];
  author?: string;
  twitterHandle?: string;
  ogImage?: string;
  language?: string;
  industry?: string;
}

interface SEOOptimizationResult {
  metaTags: string;
  structuredData: string;
  sitemap: string;
  robotsTxt: string;
  openGraphTags: string;
  twitterCardTags: string;
  canonicalUrls: Record<string, string>;
  altTextSuggestions: Record<string, string>;
  headingStructure: string[];
  internalLinkingSuggestions: string[];
  seoScore: number;
  recommendations: string[];
}

export async function generateSEOOptimization(config: SEOConfig): Promise<SEOOptimizationResult> {
  // Generate AI-powered SEO recommendations
  const prompt = `Generate comprehensive SEO optimization for a website with these details:
- Site Name: ${config.siteName}
- Description: ${config.siteDescription}
- URL: ${config.siteUrl}
- Keywords: ${config.keywords.join(", ")}
- Industry: ${config.industry || "General"}

Provide:
1. Optimized meta description (150-160 chars)
2. Title tag suggestions for key pages
3. Structured data (JSON-LD) for organization
4. Internal linking strategy
5. Content optimization tips

Return as JSON.`;

  const response = await openrouterClient.chat.completions.create({
    model: "meta-llama/llama-3-70b-instruct:free",
    messages: [
      {
        role: "system",
        content: "You are an expert SEO consultant. Generate comprehensive SEO recommendations.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const aiRecommendations = JSON.parse(response.choices[0].message.content || "{}");

  // Generate meta tags
  const metaTags = generateMetaTags(config, aiRecommendations);

  // Generate structured data
  const structuredData = generateStructuredData(config);

  // Generate sitemap
  const sitemap = generateSitemap(config);

  // Generate robots.txt
  const robotsTxt = generateRobotsTxt(config);

  // Generate Open Graph tags
  const openGraphTags = generateOpenGraphTags(config);

  // Generate Twitter Card tags
  const twitterCardTags = generateTwitterCardTags(config);

  // Calculate SEO score
  const seoScore = calculateSEOScore(config);

  return {
    metaTags,
    structuredData,
    sitemap,
    robotsTxt,
    openGraphTags,
    twitterCardTags,
    canonicalUrls: {
      "/": config.siteUrl,
      "/about": `${config.siteUrl}/about`,
      "/contact": `${config.siteUrl}/contact`,
    },
    altTextSuggestions: {},
    headingStructure: aiRecommendations.headingStructure || [],
    internalLinkingSuggestions: aiRecommendations.internalLinking || [],
    seoScore,
    recommendations: aiRecommendations.recommendations || [],
  };
}

function generateMetaTags(config: SEOConfig, aiRecs: any): string {
  const lang = config.language || "en";
  const description = aiRecs.metaDescription || config.siteDescription;

  return `
<!-- Primary Meta Tags -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${description}" />
<meta name="keywords" content="${config.keywords.join(", ")}" />
<meta name="author" content="${config.author || config.siteName}" />
<meta name="language" content="${lang}" />
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow" />
<meta name="revisit-after" content="7 days" />

<!-- Canonical URL -->
<link rel="canonical" href="${config.siteUrl}" />

<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- DNS Prefetch for Performance -->
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
`.trim();
}

function generateStructuredData(config: SEOConfig): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.siteName,
    description: config.siteDescription,
    url: config.siteUrl,
    logo: config.ogImage || `${config.siteUrl}/logo.png`,
    sameAs: config.twitterHandle ? [`https://twitter.com/${config.twitterHandle}`] : [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      url: `${config.siteUrl}/contact`,
    },
  };

  return `
<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
</script>
`.trim();
}

function generateSitemap(config: SEOConfig): string {
  const pages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/about", priority: "0.8", changefreq: "monthly" },
    { url: "/contact", priority: "0.7", changefreq: "monthly" },
    { url: "/blog", priority: "0.9", changefreq: "weekly" },
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${config.siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return sitemapXml;
}

function generateRobotsTxt(config: SEOConfig): string {
  return `# robots.txt for ${config.siteName}
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/

# Sitemap
Sitemap: ${config.siteUrl}/sitemap.xml

# Crawl-delay for polite bots
Crawl-delay: 1
`;
}

function generateOpenGraphTags(config: SEOConfig): string {
  return `
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${config.siteUrl}" />
<meta property="og:title" content="${config.siteName}" />
<meta property="og:description" content="${config.siteDescription}" />
<meta property="og:image" content="${config.ogImage || `${config.siteUrl}/og-image.jpg`}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="${config.siteName}" />
<meta property="og:locale" content="${config.language || "en_US"}" />
`.trim();
}

function generateTwitterCardTags(config: SEOConfig): string {
  return `
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="${config.siteUrl}" />
<meta name="twitter:title" content="${config.siteName}" />
<meta name="twitter:description" content="${config.siteDescription}" />
<meta name="twitter:image" content="${config.ogImage || `${config.siteUrl}/twitter-card.jpg`}" />
${config.twitterHandle ? `<meta name="twitter:site" content="@${config.twitterHandle}" />` : ""}
${config.twitterHandle ? `<meta name="twitter:creator" content="@${config.twitterHandle}" />` : ""}
`.trim();
}

function calculateSEOScore(config: SEOConfig): number {
  let score = 100;

  // Check meta description length
  if (config.siteDescription.length < 120 || config.siteDescription.length > 160) {
    score -= 10;
  }

  // Check keywords
  if (config.keywords.length < 3) {
    score -= 15;
  }

  // Check if OG image provided
  if (!config.ogImage) {
    score -= 10;
  }

  // Check if Twitter handle provided
  if (!config.twitterHandle) {
    score -= 5;
  }

  // Check if author provided
  if (!config.author) {
    score -= 5;
  }

  return Math.max(0, score);
}

export async function optimizePageSEO(
  pageContent: string,
  pageName: string,
  config: SEOConfig
): Promise<{
  optimizedContent: string;
  suggestions: string[];
  seoScore: number;
}> {
  const prompt = `Analyze this HTML page content and provide SEO optimization suggestions:

Page: ${pageName}
Content: ${pageContent.slice(0, 2000)}

Provide:
1. Missing or weak meta tags
2. Heading structure issues
3. Image alt text gaps
4. Internal linking opportunities
5. Content optimization tips

Return as JSON with: { suggestions: [], seoScore: number }`;

  const response = await openrouterClient.chat.completions.create({
    model: "meta-llama/llama-3-70b-instruct:free",
    messages: [
      {
        role: "system",
        content: "You are an SEO expert analyzing web pages for optimization opportunities.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const analysis = JSON.parse(response.choices[0].message.content || "{}");

  return {
    optimizedContent: pageContent, // In production, apply optimizations
    suggestions: analysis.suggestions || [],
    seoScore: analysis.seoScore || 70,
  };
}

export function injectSEOIntoHTML(html: string, seoData: SEOOptimizationResult): string {
  // Inject SEO tags into HTML head
  const headEndIndex = html.indexOf("</head>");
  if (headEndIndex === -1) return html;

  const seoInjection = `
${seoData.metaTags}
${seoData.openGraphTags}
${seoData.twitterCardTags}
${seoData.structuredData}
`;

  return html.slice(0, headEndIndex) + seoInjection + html.slice(headEndIndex);
}
