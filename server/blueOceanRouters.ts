/**
 * InTheWild — Blue Ocean Feature Routes
 * Micro-app engine, deployment pipeline, template marketplace, SEO, e-commerce
 */

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateMicroApp, generateMicroAppFromTemplate, generateMicroAppFromVoice } from "./services/microAppEngine";
import { deployProject, getDeploymentStatus } from "./services/deploymentPipeline";
import { templateMarketplace } from "./services/templateMarketplace";
import { generateSEOOptimization, injectSEOIntoHTML } from "./services/aiSEOOptimizer";
import { generateEcommerceComponents, generateStripeBackend } from "./services/ecommerceIntegration";

export const blueOceanRouter = router({
  // ─── Micro-App Generation Engine ─────────────────────────────────────
  microApp: router({
    generate: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          type: z.enum(["todo", "notes", "kanban", "crm", "analytics", "ecommerce", "booking", "survey"]),
          description: z.string(),
          features: z.array(z.string()),
          includeAuth: z.boolean().default(true),
          includeDatabase: z.boolean().default(true),
          includePayments: z.boolean().default(false),
          includeAnalytics: z.boolean().default(true),
          theme: z.enum(["light", "dark", "custom"]).default("light"),
          customColors: z
            .object({
              primary: z.string(),
              secondary: z.string(),
              accent: z.string(),
            })
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await generateMicroApp(input);
          return { success: true, data: result };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to generate micro-app",
          });
        }
      }),

    generateFromTemplate: protectedProcedure
      .input(
        z.object({
          templateId: z.string(),
          customizations: z.record(z.any()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await generateMicroAppFromTemplate(
            input.templateId,
            input.customizations || {}
          );
          return { success: true, data: result };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to generate from template",
          });
        }
      }),

    generateFromVoice: protectedProcedure
      .input(z.object({ voiceTranscript: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const result = await generateMicroAppFromVoice(input.voiceTranscript);
          return { success: true, data: result };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to generate from voice",
          });
        }
      }),
  }),

  // ─── Deployment Pipeline ─────────────────────────────────────────────
  deployment: router({
    deploy: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
          projectName: z.string(),
          platform: z.enum(["vercel", "netlify", "railway", "docker"]),
          domain: z.string().optional(),
          customDomain: z.string().optional(),
          envVars: z.record(z.string()),
          buildCommand: z.string().optional(),
          startCommand: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await deployProject(input);
          return { success: result.success, data: result };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Deployment failed",
          });
        }
      }),

    getStatus: protectedProcedure
      .input(z.object({ deploymentId: z.string() }))
      .query(async ({ input }) => {
        const status = await getDeploymentStatus(input.deploymentId);
        return status;
      }),
  }),

  // ─── Template Marketplace ────────────────────────────────────────────
  marketplace: router({
    listTemplate: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string(),
          category: z.enum(["landing", "saas", "ecommerce", "portfolio", "blog", "dashboard", "app"]),
          price: z.number().min(0),
          tags: z.array(z.string()),
          features: z.array(z.string()),
          code: z.object({
            frontend: z.string(),
            backend: z.string(),
            database: z.string(),
            config: z.string(),
          }),
          previewUrl: z.string(),
          thumbnailUrl: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const template = await templateMarketplace.listTemplate(ctx.user.id, input);
        return { success: true, data: template };
      }),

    searchTemplates: publicProcedure
      .input(
        z.object({
          category: z.enum(["landing", "saas", "ecommerce", "portfolio", "blog", "dashboard", "app"]).optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          tags: z.array(z.string()).optional(),
          searchQuery: z.string().optional(),
          sortBy: z.enum(["popular", "recent", "price-low", "price-high", "rating"]).optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const templates = await templateMarketplace.searchTemplates(input);
        return templates;
      }),

    getTemplate: publicProcedure
      .input(z.object({ templateId: z.string() }))
      .query(async ({ input }) => {
        const template = await templateMarketplace.getTemplate(input.templateId);
        if (!template) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
        }
        return template;
      }),

    purchaseTemplate: protectedProcedure
      .input(z.object({ templateId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const result = await templateMarketplace.purchaseTemplate(ctx.user.id, input.templateId);
        if (!result.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error || "Purchase failed" });
        }
        return result;
      }),

    getUserTemplates: protectedProcedure.query(async ({ ctx }) => {
      const templates = await templateMarketplace.getUserTemplates(ctx.user.id);
      return templates;
    }),

    getStats: publicProcedure.query(async () => {
      const stats = await templateMarketplace.getMarketplaceStats();
      return stats;
    }),

    rateTemplate: protectedProcedure
      .input(
        z.object({
          templateId: z.string(),
          rating: z.number().min(1).max(5),
          review: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await templateMarketplace.rateTemplate(
          ctx.user.id,
          input.templateId,
          input.rating,
          input.review
        );
        return result;
      }),
  }),

  // ─── AI SEO Optimization ─────────────────────────────────────────────
  seo: router({
    generateOptimization: protectedProcedure
      .input(
        z.object({
          siteName: z.string(),
          siteDescription: z.string(),
          siteUrl: z.string(),
          keywords: z.array(z.string()),
          author: z.string().optional(),
          twitterHandle: z.string().optional(),
          ogImage: z.string().optional(),
          language: z.string().optional(),
          industry: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await generateSEOOptimization(input);
          return { success: true, data: result };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "SEO generation failed",
          });
        }
      }),

    injectSEO: protectedProcedure
      .input(
        z.object({
          html: z.string(),
          seoData: z.any(),
        })
      )
      .mutation(async ({ input }) => {
        const optimizedHtml = injectSEOIntoHTML(input.html, input.seoData);
        return { success: true, html: optimizedHtml };
      }),
  }),

  // ─── E-Commerce Integration ──────────────────────────────────────────
  ecommerce: router({
    generateComponents: protectedProcedure.query(() => {
      const components = generateEcommerceComponents();
      return components;
    }),

    generateBackend: protectedProcedure.query(() => {
      const backend = generateStripeBackend();
      return { backend };
    }),
  }),
});
