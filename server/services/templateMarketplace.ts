/**
 * InTheWild — Template Marketplace
 * Users can buy, sell, and share their generated site templates.
 * Revenue sharing model: 70% to creator, 30% platform fee.
 */

interface Template {
  id: string;
  name: string;
  description: string;
  category: "landing" | "saas" | "ecommerce" | "portfolio" | "blog" | "dashboard" | "app";
  price: number; // in cents, 0 = free
  creatorId: string;
  creatorName: string;
  downloads: number;
  rating: number;
  reviews: number;
  previewUrl: string;
  thumbnailUrl: string;
  tags: string[];
  features: string[];
  techStack: string[];
  code: {
    frontend: string;
    backend: string;
    database: string;
    config: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  isPremium: boolean;
}

interface TemplateListingRequest {
  name: string;
  description: string;
  category: Template["category"];
  price: number;
  tags: string[];
  features: string[];
  code: Template["code"];
  previewUrl: string;
  thumbnailUrl: string;
}

interface MarketplaceStats {
  totalTemplates: number;
  totalCreators: number;
  totalDownloads: number;
  totalRevenue: number;
  topTemplates: Template[];
  trendingCategories: string[];
}

export class TemplateMarketplace {
  private templates: Map<string, Template> = new Map();
  private userTemplates: Map<string, string[]> = new Map();

  constructor() {
    this.seedMarketplace();
  }

  private seedMarketplace() {
    // Seed with example templates
    const seedTemplates: Template[] = [
      {
        id: "tmpl-001",
        name: "SaaS Landing Pro",
        description: "Modern SaaS landing page with pricing, testimonials, and CTAs",
        category: "saas",
        price: 4900, // $49
        creatorId: "user-001",
        creatorName: "DesignMaster",
        downloads: 342,
        rating: 4.8,
        reviews: 67,
        previewUrl: "https://preview.inthewild.app/saas-landing-pro",
        thumbnailUrl: "https://cdn.inthewild.app/thumbnails/saas-landing-pro.jpg",
        tags: ["saas", "landing", "pricing", "modern", "responsive"],
        features: ["Pricing tables", "Testimonials", "FAQ section", "Newsletter signup", "Mobile responsive"],
        techStack: ["React", "TypeScript", "TailwindCSS", "Framer Motion"],
        code: {
          frontend: "// React components here",
          backend: "// API routes here",
          database: "// Schema here",
          config: "// Config here",
        },
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-10"),
        isVerified: true,
        isPremium: true,
      },
      {
        id: "tmpl-002",
        name: "E-Commerce Starter",
        description: "Full e-commerce site with Stripe integration and cart",
        category: "ecommerce",
        price: 9900, // $99
        creatorId: "user-002",
        creatorName: "ShopifyKiller",
        downloads: 198,
        rating: 4.9,
        reviews: 42,
        previewUrl: "https://preview.inthewild.app/ecommerce-starter",
        thumbnailUrl: "https://cdn.inthewild.app/thumbnails/ecommerce-starter.jpg",
        tags: ["ecommerce", "stripe", "cart", "checkout", "products"],
        features: ["Product catalog", "Shopping cart", "Stripe checkout", "Order management", "Admin dashboard"],
        techStack: ["React", "TypeScript", "TailwindCSS", "Stripe", "PostgreSQL"],
        code: {
          frontend: "// React components here",
          backend: "// API routes here",
          database: "// Schema here",
          config: "// Config here",
        },
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-18"),
        isVerified: true,
        isPremium: true,
      },
      {
        id: "tmpl-003",
        name: "Portfolio Minimal",
        description: "Clean, minimal portfolio for designers and developers",
        category: "portfolio",
        price: 0, // Free
        creatorId: "user-003",
        creatorName: "MinimalDesign",
        downloads: 1247,
        rating: 4.6,
        reviews: 203,
        previewUrl: "https://preview.inthewild.app/portfolio-minimal",
        thumbnailUrl: "https://cdn.inthewild.app/thumbnails/portfolio-minimal.jpg",
        tags: ["portfolio", "minimal", "clean", "designer", "developer"],
        features: ["Project showcase", "About section", "Contact form", "Blog integration", "Dark mode"],
        techStack: ["React", "TypeScript", "TailwindCSS"],
        code: {
          frontend: "// React components here",
          backend: "// API routes here",
          database: "// Schema here",
          config: "// Config here",
        },
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-02-05"),
        isVerified: true,
        isPremium: false,
      },
    ];

    seedTemplates.forEach((template) => {
      this.templates.set(template.id, template);
      const userTemplates = this.userTemplates.get(template.creatorId) || [];
      userTemplates.push(template.id);
      this.userTemplates.set(template.creatorId, userTemplates);
    });
  }

  async listTemplate(userId: string, request: TemplateListingRequest): Promise<Template> {
    const templateId = `tmpl-${Date.now()}`;
    const template: Template = {
      id: templateId,
      name: request.name,
      description: request.description,
      category: request.category,
      price: request.price,
      creatorId: userId,
      creatorName: "User", // Would fetch from user profile
      downloads: 0,
      rating: 0,
      reviews: 0,
      previewUrl: request.previewUrl,
      thumbnailUrl: request.thumbnailUrl,
      tags: request.tags,
      features: request.features,
      techStack: ["React", "TypeScript", "TailwindCSS"],
      code: request.code,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      isPremium: request.price > 0,
    };

    this.templates.set(templateId, template);

    const userTemplates = this.userTemplates.get(userId) || [];
    userTemplates.push(templateId);
    this.userTemplates.set(userId, userTemplates);

    return template;
  }

  async getTemplate(templateId: string): Promise<Template | null> {
    return this.templates.get(templateId) || null;
  }

  async searchTemplates(filters: {
    category?: Template["category"];
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    searchQuery?: string;
    sortBy?: "popular" | "recent" | "price-low" | "price-high" | "rating";
    limit?: number;
  }): Promise<Template[]> {
    let results = Array.from(this.templates.values());

    // Apply filters
    if (filters.category) {
      results = results.filter((t) => t.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((t) => t.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((t) => t.price <= filters.maxPrice!);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((t) => filters.tags!.some((tag) => t.tags.includes(tag)));
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "popular":
        results.sort((a, b) => b.downloads - a.downloads);
        break;
      case "recent":
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "price-low":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        results.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
    }

    // Limit
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  async purchaseTemplate(userId: string, templateId: string): Promise<{
    success: boolean;
    downloadUrl?: string;
    error?: string;
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Process payment (integrate with Stripe)
    if (template.price > 0) {
      // In production: create Stripe payment intent
      // For now, mock success
    }

    // Increment download count
    template.downloads += 1;
    this.templates.set(templateId, template);

    // Calculate revenue split (70% to creator, 30% platform)
    const creatorRevenue = Math.floor(template.price * 0.7);
    const platformRevenue = template.price - creatorRevenue;

    // In production: transfer funds to creator's Stripe Connect account

    return {
      success: true,
      downloadUrl: `https://downloads.inthewild.app/${templateId}`,
    };
  }

  async getUserTemplates(userId: string): Promise<Template[]> {
    const templateIds = this.userTemplates.get(userId) || [];
    return templateIds.map((id) => this.templates.get(id)!).filter(Boolean);
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const allTemplates = Array.from(this.templates.values());

    const totalRevenue = allTemplates.reduce((sum, t) => sum + t.price * t.downloads, 0);

    const topTemplates = allTemplates
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10);

    const categoryCounts: Record<string, number> = {};
    allTemplates.forEach((t) => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    const trendingCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    return {
      totalTemplates: allTemplates.length,
      totalCreators: this.userTemplates.size,
      totalDownloads: allTemplates.reduce((sum, t) => sum + t.downloads, 0),
      totalRevenue,
      topTemplates,
      trendingCategories,
    };
  }

  async rateTemplate(
    userId: string,
    templateId: string,
    rating: number,
    review?: string
  ): Promise<{ success: boolean }> {
    const template = this.templates.get(templateId);
    if (!template) {
      return { success: false };
    }

    // Update rating (simplified - in production, store individual ratings)
    const newTotalRating = template.rating * template.reviews + rating;
    template.reviews += 1;
    template.rating = newTotalRating / template.reviews;

    this.templates.set(templateId, template);

    return { success: true };
  }

  async verifyTemplate(templateId: string): Promise<{ success: boolean }> {
    const template = this.templates.get(templateId);
    if (!template) {
      return { success: false };
    }

    template.isVerified = true;
    this.templates.set(templateId, template);

    return { success: true };
  }
}

export const templateMarketplace = new TemplateMarketplace();
