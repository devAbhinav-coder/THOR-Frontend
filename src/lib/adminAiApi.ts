/**
 * Admin AI endpoints — separate module so Webpack/HMR does not drop nested
 * methods on the large `adminApi` object (see comment in api.ts).
 */
import { api } from "@/lib/api";
import { unwrapAxios } from "@/lib/parseApi";
import * as schemas from "@/lib/api-schemas";

const AI_TIMEOUT = 60_000;

export const adminAiApi = {
  getStatus: () =>
    unwrapAxios("admin.ai.status", api.get("/admin/ai/status"), schemas.adminAiStatus),

  getDailyBrief: (force?: boolean) =>
    unwrapAxios(
      "admin.ai.dailyBrief",
      api.get("/admin/ai/daily-brief", {
        params: force ? { force: "true" } : {},
        timeout: AI_TIMEOUT,
      }),
      schemas.adminAiTextResponse,
    ),

  getActionSuggestions: () =>
    unwrapAxios(
      "admin.ai.actions",
      api.get("/admin/ai/action-suggestions", { timeout: AI_TIMEOUT }),
      schemas.adminAiActionSuggestions,
    ),

  explainOrder: (orderId: string) =>
    unwrapAxios(
      "admin.ai.explainOrder",
      api.get(`/admin/ai/explain/order/${orderId}`, { timeout: AI_TIMEOUT }),
      schemas.adminAiTextResponse,
    ),

  explainUser: (userId: string) =>
    unwrapAxios(
      "admin.ai.explainUser",
      api.get(`/admin/ai/explain/user/${userId}`, { timeout: AI_TIMEOUT }),
      schemas.adminAiTextResponse,
    ),

  explainReturns: () =>
    unwrapAxios(
      "admin.ai.explainReturns",
      api.get("/admin/ai/explain/returns", { timeout: AI_TIMEOUT }),
      schemas.adminAiTextResponse,
    ),

  draftProductCopy: (body: {
    name: string;
    category?: string;
    subcategory?: string;
    fabric?: string;
    price?: number;
    comparePrice?: number;
    tags?: string[];
    shortDescription?: string;
    designNotes?: string;
    variants?: Array<{
      size?: string;
      color?: string;
      sku?: string;
      stock?: number;
      price?: number;
    }>;
    productId?: string;
  }) =>
    unwrapAxios(
      "admin.ai.draftProduct",
      api.post("/admin/ai/draft/product", body, { timeout: AI_TIMEOUT }),
      schemas.adminAiProductDraft,
    ),

  draftCatalogSeo: (body: {
    kind: "category" | "subcategory";
    name: string;
    parentCategoryName?: string;
    description?: string;
  }) =>
    unwrapAxios(
      "admin.ai.draftCatalogSeo",
      api.post("/admin/ai/draft/catalog-seo", body, { timeout: AI_TIMEOUT }),
      schemas.adminAiCatalogSeoDraft,
    ),

  draftReviewReply: (reviewId: string) =>
    unwrapAxios(
      "admin.ai.draftReview",
      api.post(`/admin/ai/draft/review/${reviewId}`, {}, { timeout: AI_TIMEOUT }),
      schemas.adminAiReviewDraft,
    ),

  draftMarketingEmail: (body: {
    adminBrief: string;
    subjectHint?: string;
    audience?: string;
    estimatedRecipients?: number;
    ctaText?: string;
    ctaLink?: string;
    tone?: string;
  }) =>
    unwrapAxios(
      "admin.ai.draftEmail",
      api.post("/admin/ai/draft/marketing-email", body, { timeout: AI_TIMEOUT }),
      schemas.adminAiMarketingDraft,
    ),

  planBlogCalendar: (body: {
    weeks?: number;
    postsPerWeek?: number;
    focus?: string;
    regenerate?: boolean;
  }) =>
    unwrapAxios(
      "admin.ai.blogCalendar",
      api.post("/admin/ai/blog-calendar/plan", body, { timeout: AI_TIMEOUT }),
      schemas.adminAiBlogCalendarPlan,
    ),

  draftBlogPost: (body: {
    topic: string;
    keywords?: string[];
    category?: string;
    tone?: string;
    targetLength?: "short" | "medium" | "long";
    linkProductIds?: string[];
    includeProductLinks?: boolean;
    regenerate?: boolean;
  }) =>
    unwrapAxios(
      "admin.ai.draftBlog",
      api.post("/admin/ai/draft/blog", body, { timeout: AI_TIMEOUT }),
      schemas.adminAiBlogDraft,
    ),

  askStore: (
    question: string,
    history?: Array<{ role: "user" | "assistant"; content: string }>,
  ) =>
    unwrapAxios(
      "admin.ai.ask",
      api.post(
        "/admin/ai/ask",
        { question, ...(history?.length ? { history } : {}) },
        { timeout: AI_TIMEOUT },
      ),
      schemas.adminAiTextResponse,
    ),
};
