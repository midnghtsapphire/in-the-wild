import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { blueOceanRouter } from "./blueOceanRouters";
import { generateFullStack } from "./services/fullStackGenerator";
import { getDb, upsertGeneration, getUserTokenUsage, updateTokenUsage } from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  blueOcean: blueOceanRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ─── Full-Stack Generation ─────────────────────────────────────
  generation: router({
    /**
     * Generate a complete full-stack application from a prompt
     * This is the core feature: frontend + backend + database + deployment
     */
    generate: protectedProcedure
      .input(
        z.object({
          prompt: z.string().min(10, "Prompt must be at least 10 characters"),
          projectName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Check token usage
          const tokenUsage = await getUserTokenUsage(ctx.user.id);
          const isPremium = tokenUsage.tier === "pro" || tokenUsage.tier === "business";

          if (tokenUsage.tokensUsedThisMonth >= tokenUsage.monthlyLimit) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Monthly token limit exceeded. Upgrade your plan.",
            });
          }

          // Generate full-stack application
          const result = await generateFullStack(input.prompt, isPremium);

          // Save generation record
          const db = await getDb();
          if (db) {
            const generation = await upsertGeneration(db, {
              userId: ctx.user.id,
              projectName: input.projectName || result.projectName,
              prompt: input.prompt,
              frontendCode: result.frontend.html,
              backendCode: result.backend.expressRoutes,
              databaseSchema: result.database.schema,
              status: "generated",
              deploymentUrl: result.deploymentUrl,
            });

            result.projectId = generation.id;
          }

          // Update token usage
          const tokensUsed = Math.ceil(input.prompt.length / 10); // Rough estimate
          await updateTokenUsage(ctx.user.id, tokensUsed);

          return {
            success: true,
            projectId: result.projectId,
            projectName: result.projectName,
            estimatedDeployTime: result.estimatedDeployTime,
            preview: {
              frontend: result.frontend.html.slice(0, 500),
              backendRoutes: result.backend.expressRoutes.slice(0, 300),
            },
          };
        } catch (error: any) {
          console.error("[Generation] Failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to generate application",
          });
        }
      }),

    /**
     * Get generated project details
     */
    getProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        // TODO: Fetch from database
        return {
          id: input.projectId,
          name: "Sample Project",
          prompt: "A simple todo app",
          status: "generated",
          createdAt: new Date(),
          frontend: "<html>...</html>",
          backend: "// Express routes",
          database: "// Schema",
          deploymentUrl: "https://example.manus.space",
        };
      }),

    /**
     * List user's projects
     */
    listProjects: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      // TODO: Query from database
      return [];
    }),

    /**
     * Deploy a generated project
     */
    deploy: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // TODO: Implement deployment logic
          return {
            success: true,
            deploymentUrl: `https://${input.projectId}.manus.space`,
            status: "deploying",
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Deployment failed",
          });
        }
      }),
  }),

  // ─── Token Usage & Billing ─────────────────────────────────────
  billing: router({
    /**
     * Get current token usage
     */
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      const tokenUsage = await getUserTokenUsage(ctx.user.id);
      return {
        tier: tokenUsage.tier,
        tokensUsed: tokenUsage.tokensUsedThisMonth,
        monthlyLimit: tokenUsage.monthlyLimit,
        percentageUsed: (tokenUsage.tokensUsedThisMonth / tokenUsage.monthlyLimit) * 100,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      };
    }),

    /**
     * Get subscription plans
     */
    getPlans: publicProcedure.query(() => {
      return [
        {
          id: "free",
          name: "Free",
          price: 0,
          monthlyTokens: 50000,
          features: ["2 free LLM models", "Basic generation", "Community support"],
        },
        {
          id: "pro",
          name: "Pro",
          price: 29,
          monthlyTokens: 500000,
          features: ["Premium LLM models", "Advanced generation", "Priority support", "Custom domains"],
        },
        {
          id: "business",
          name: "Business",
          price: 99,
          monthlyTokens: 5000000,
          features: ["All Pro features", "Unlimited API calls", "Dedicated support", "SLA"],
        },
      ];
    }),

    /**
     * Create checkout session for Stripe
     */
    createCheckout: protectedProcedure
      .input(z.object({ planId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement Stripe checkout
        return {
          sessionId: "cs_test_123",
          checkoutUrl: "https://checkout.stripe.com/...",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
