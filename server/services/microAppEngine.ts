/**
 * InTheWild — Micro-App Generation Engine
 * Generate full working micro-applications, not just static sites.
 * Includes React components, backend APIs, database schemas, authentication.
 */

import { openrouterClient } from "./openrouter";

interface MicroAppSpec {
  name: string;
  type: "todo" | "notes" | "kanban" | "crm" | "analytics" | "ecommerce" | "booking" | "survey";
  description: string;
  features: string[];
  includeAuth: boolean;
  includeDatabase: boolean;
  includePayments: boolean;
  includeAnalytics: boolean;
  theme: "light" | "dark" | "custom";
  customColors?: { primary: string; secondary: string; accent: string };
}

interface GeneratedMicroApp {
  name: string;
  type: string;
  frontend: {
    components: Record<string, string>;
    pages: Record<string, string>;
    hooks: Record<string, string>;
    styles: string;
  };
  backend: {
    routes: string;
    models: string;
    middleware: string;
    services: string;
  };
  database: {
    schema: string;
    migrations: string;
  };
  config: {
    env: string;
    vite: string;
    tsconfig: string;
  };
  deployment: {
    dockerfile: string;
    dockerCompose: string;
    vercelConfig: string;
  };
  estimatedDeployTime: number;
  features: string[];
}

export async function generateMicroApp(spec: MicroAppSpec): Promise<GeneratedMicroApp> {
  const prompt = buildMicroAppPrompt(spec);

  const response = await openrouterClient.chat.completions.create({
    model: "meta-llama/llama-3-70b-instruct:free",
    messages: [
      {
        role: "system",
        content: `You are an expert full-stack developer generating production-ready micro-applications.
Generate complete, working code for ${spec.type} applications with:
- React components with TypeScript
- Express.js backend routes
- Database schemas (Drizzle ORM)
- Authentication (if requested)
- Stripe integration (if payments requested)
- Full deployment configuration

Return JSON with structure: { frontend: { components: {}, pages: {}, hooks: {}, styles: "" }, backend: { routes: "", models: "", middleware: "", services: "" }, database: { schema: "", migrations: "" }, config: { env: "", vite: "", tsconfig: "" }, deployment: { dockerfile: "", dockerCompose: "", vercelConfig: "" } }`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 8000,
  });

  const content = response.choices[0].message.content || "{}";
  const generated = JSON.parse(content);

  return {
    name: spec.name,
    type: spec.type,
    frontend: generated.frontend || { components: {}, pages: {}, hooks: {}, styles: "" },
    backend: generated.backend || { routes: "", models: "", middleware: "", services: "" },
    database: generated.database || { schema: "", migrations: "" },
    config: generated.config || { env: "", vite: "", tsconfig: "" },
    deployment: generated.deployment || { dockerfile: "", dockerCompose: "", vercelConfig: "" },
    estimatedDeployTime: 5,
    features: spec.features,
  };
}

function buildMicroAppPrompt(spec: MicroAppSpec): string {
  const features = spec.features.map((f) => `- ${f}`).join("\n");

  return `Generate a complete ${spec.type} micro-application with these specifications:

Name: ${spec.name}
Description: ${spec.description}

Features:
${features}

Requirements:
- Include authentication: ${spec.includeAuth ? "YES (JWT + OAuth)" : "NO"}
- Include database: ${spec.includeDatabase ? "YES (PostgreSQL with Drizzle ORM)" : "NO"}
- Include payments: ${spec.includePayments ? "YES (Stripe integration)" : "NO"}
- Include analytics: ${spec.includeAnalytics ? "YES (Posthog or similar)" : "NO"}
- Theme: ${spec.theme}${spec.customColors ? ` (Primary: ${spec.customColors.primary}, Secondary: ${spec.customColors.secondary}, Accent: ${spec.customColors.accent})` : ""}

Generate production-ready code with:
1. React components (TypeScript) with proper error handling
2. Express.js backend with tRPC procedures
3. Database models and migrations
4. Environment configuration
5. Docker deployment files
6. Vercel configuration for serverless deployment

Return as JSON object with all code files.`;
}

export async function generateMicroAppFromTemplate(
  templateId: string,
  customizations: Record<string, any>
): Promise<GeneratedMicroApp> {
  // Fetch template from marketplace
  const templates: Record<string, MicroAppSpec> = {
    "todo-pro": {
      name: "Todo Pro",
      type: "todo",
      description: "Advanced todo app with collaboration",
      features: ["Create/edit/delete tasks", "Drag-and-drop reordering", "Collaboration", "Due dates", "Priority levels"],
      includeAuth: true,
      includeDatabase: true,
      includePayments: false,
      includeAnalytics: true,
      theme: "light",
    },
    "crm-lite": {
      name: "CRM Lite",
      type: "crm",
      description: "Lightweight CRM for small teams",
      features: ["Contact management", "Deal tracking", "Activity log", "Email integration", "Reports"],
      includeAuth: true,
      includeDatabase: true,
      includePayments: true,
      includeAnalytics: true,
      theme: "dark",
    },
    "booking-system": {
      name: "Booking System",
      type: "booking",
      description: "Service booking and scheduling",
      features: ["Calendar view", "Availability management", "Client booking", "Notifications", "Payments"],
      includeAuth: true,
      includeDatabase: true,
      includePayments: true,
      includeAnalytics: true,
      theme: "light",
    },
  };

  const template = templates[templateId];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Apply customizations
  const spec: MicroAppSpec = {
    ...template,
    ...customizations,
  };

  return generateMicroApp(spec);
}

export async function generateMicroAppFromVoice(voiceTranscript: string): Promise<GeneratedMicroApp> {
  // Parse voice input to determine app type and features
  const analysisResponse = await openrouterClient.chat.completions.create({
    model: "meta-llama/llama-3-70b-instruct:free",
    messages: [
      {
        role: "system",
        content: `Analyze the user's voice request and extract the micro-app specification.
Return JSON: { type: "todo|notes|kanban|crm|analytics|ecommerce|booking|survey", features: [], includeAuth: boolean, includeDatabase: boolean, includePayments: boolean }`,
      },
      {
        role: "user",
        content: `User request: "${voiceTranscript}"`,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const analysis = JSON.parse(analysisResponse.choices[0].message.content || "{}");

  const spec: MicroAppSpec = {
    name: `Generated App - ${new Date().toLocaleDateString()}`,
    type: analysis.type || "todo",
    description: voiceTranscript,
    features: analysis.features || [],
    includeAuth: analysis.includeAuth ?? true,
    includeDatabase: analysis.includeDatabase ?? true,
    includePayments: analysis.includePayments ?? false,
    includeAnalytics: true,
    theme: "light",
  };

  return generateMicroApp(spec);
}

export function validateMicroApp(app: GeneratedMicroApp): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check frontend
  if (!app.frontend.pages || Object.keys(app.frontend.pages).length === 0) {
    errors.push("No frontend pages generated");
  }

  // Check backend
  if (!app.backend.routes || app.backend.routes.length < 100) {
    errors.push("Backend routes incomplete");
  }

  // Check database (if included)
  if (app.features.some((f) => f.toLowerCase().includes("database")) && !app.database.schema) {
    errors.push("Database schema missing");
  }

  // Check deployment
  if (!app.deployment.dockerfile) {
    errors.push("Docker configuration missing");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function estimateComplexity(spec: MicroAppSpec): {
  complexity: "simple" | "moderate" | "complex";
  estimatedLines: number;
  estimatedDeployTime: number;
} {
  let score = 0;

  // Feature complexity
  score += spec.features.length * 10;

  // Auth adds complexity
  if (spec.includeAuth) score += 50;

  // Database adds complexity
  if (spec.includeDatabase) score += 40;

  // Payments add complexity
  if (spec.includePayments) score += 60;

  // Analytics adds complexity
  if (spec.includeAnalytics) score += 30;

  let complexity: "simple" | "moderate" | "complex" = "simple";
  if (score > 150) complexity = "complex";
  else if (score > 80) complexity = "moderate";

  const estimatedLines = score * 15;
  const estimatedDeployTime = complexity === "simple" ? 3 : complexity === "moderate" ? 5 : 10;

  return { complexity, estimatedLines, estimatedDeployTime };
}
