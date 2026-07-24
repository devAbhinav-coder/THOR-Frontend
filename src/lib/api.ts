import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { refreshAccessToken } from "@/lib/authRefresh";
import { env } from "@/lib/env";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { isPostCheckoutAuthGuardActive } from "@/lib/checkoutSuccessGuard";
import { unwrapAxios, parseApiResponse } from "@/lib/parseApi";
import * as schemas from "@/lib/api-schemas";
import {
  isAuthPublicRequest,
  isAuthMeRequest,
} from "@/lib/authRequestPaths";
import type {
  AdminCreateOfflineOrderBody,
  AdminSalesInvoiceWriteBody,
} from "@/types";
import { toastForNonAuthHttpError } from "@/lib/httpClientToast";
import { getForgotPasswordVerifyIdempotencyKey } from "@/lib/authOtpClient";

/** Shared axios instance (interceptors, base URL). Exported so thin modules
 *  like `invoiceStore` can call endpoints without depending on the full
 *  `adminApi` object graph (avoids rare bundler/HMR cases where nested methods
 *  are missing at runtime). */
export const api: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

const STOREFRONT_SETTINGS_CLIENT_CACHE_MS = 45_000;
type StorefrontSettingsResponse = schemas.StorefrontSettingsApiEnvelope;
let storefrontSettingsInFlight: Promise<StorefrontSettingsResponse> | null = null;
let storefrontSettingsCache: {
  expiresAt: number;
  value: StorefrontSettingsResponse;
} | null = null;

/**
 * Instance default is `application/json`, so axios `transformRequest` would run
 * `JSON.stringify(formDataToJSON(data))` on FormData and drop binary parts — uploads
 * (storefront hero, products, etc.) never reach multer. Clear Content-Type so the
 * browser/XHR layer sets multipart with a proper boundary.
 */
api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    const headers = AxiosHeaders.from(config.headers);
    headers.delete("Content-Type");
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const isTimeout =
      error.code === "ECONNABORTED" ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("timeout"));
    const message = isTimeout
      ? "Request timed out. Please try again."
      : error.response?.data?.message || "Something went wrong";

    if (
      status === 401 &&
      typeof window !== "undefined" &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthPublicRequest(originalRequest)
    ) {
      originalRequest._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        if (originalRequest.headers) {
          delete originalRequest.headers.Authorization;
        }
        return api(originalRequest);
      }
      if (isPostCheckoutAuthGuardActive()) {
        return Promise.reject({ message: "Session expired", status: 401 });
      }
      const path = `${window.location.pathname}${window.location.search || ""}`;
      if (!path.startsWith("/auth") && !isAuthMeRequest(originalRequest)) {
        window.location.href = loginUrlWithRedirect(path);
      }
      return Promise.reject({ message: "Session expired", status: 401 });
    }

    toastForNonAuthHttpError(status);

    const retryAfterRaw = error.response?.data?.retryAfter;
    const retryAfter =
      typeof retryAfterRaw === "number" && retryAfterRaw > 0 ?
        Math.ceil(retryAfterRaw)
      : undefined;

    return Promise.reject({ message, status: error.response?.status, retryAfter });
  },
);

async function del204(label: string, promise: Promise<AxiosResponse<unknown>>): Promise<void> {
  const res = await promise;
  if (res.status === 204) return;
  parseApiResponse(label, res.data, schemas.nullDataSuccess);
}

export type AuthSession = {
  id: string;
  deviceLabel: string;
  ip?: string;
  createdAt: string;
  lastUsedAt?: string;
  current: boolean;
};

type WithTurnstile<T> = T & { turnstileToken?: string };

export const authApi = {
  signupStart: (
    data: WithTurnstile<{ name: string; email: string; password: string; phone: string }>,
  ) =>
    unwrapAxios("auth.signupStart", api.post("/auth/signup/start", data), schemas.authMessage),
  signupVerify: (data: WithTurnstile<{ email: string; otp: string }>) =>
    unwrapAxios("auth.signupVerify", api.post("/auth/signup/verify", data), schemas.authWithUser),
  login: (data: WithTurnstile<{ email: string; password: string }>) =>
    unwrapAxios("auth.login", api.post("/auth/login", data), schemas.authWithUser),
  google: (data: WithTurnstile<{ credential: string }>) =>
    unwrapAxios(
      "auth.google",
      api.post("/auth/google", data, { timeout: 30000 }),
      schemas.authWithUser,
    ),
  forgotPassword: (data: WithTurnstile<{ email: string }>) =>
    unwrapAxios(
      "auth.forgotPassword",
      api.post("/auth/send-otp", {
        type: "forgot_password",
        email: data.email,
        ...(data.turnstileToken ? { turnstileToken: data.turnstileToken } : {}),
      }),
      schemas.authMessage,
    ),
  resetPassword: (
    data: WithTurnstile<{ email: string; otp: string; newPassword: string }>,
  ) =>
    unwrapAxios("auth.resetPassword", api.post("/auth/reset-password", data), schemas.authResetPassword),
  sendOtp: (
    data: WithTurnstile<
      | { type: "signup"; email: string; name: string; password: string; phone: string }
      | { type: "login"; email: string }
      | { type: "forgot_password"; email: string }
    >,
  ) => unwrapAxios("auth.sendOtp", api.post("/auth/send-otp", data), schemas.authMessage),
  resendOtp: (
    data: WithTurnstile<{ email: string; type: "signup" | "login" | "forgot_password" }>,
  ) => unwrapAxios("auth.resendOtp", api.post("/auth/resend-otp", data), schemas.authMessage),
  verifyOtpSignup: (data: WithTurnstile<{ email: string; otp: string }>) =>
    unwrapAxios(
      "auth.verifyOtpSignup",
      api.post("/auth/verify-otp", { ...data, type: "signup" }),
      schemas.authWithUser,
    ),
  verifyOtpLogin: (data: WithTurnstile<{ email: string; otp: string }>) =>
    unwrapAxios(
      "auth.verifyOtpLogin",
      api.post("/auth/verify-otp", { ...data, type: "login" }),
      schemas.authWithUser,
    ),
  verifyOtpForgot: (data: WithTurnstile<{ email: string; otp: string }>) =>
    unwrapAxios(
      "auth.verifyOtpForgot",
      api.post(
        "/auth/verify-otp",
        { ...data, type: "forgot_password" },
        {
          headers: {
            "Idempotency-Key": getForgotPasswordVerifyIdempotencyKey(data.email),
          },
        },
      ),
      schemas.authForgotVerified,
    ),
  resetPasswordWithToken: (
    data: WithTurnstile<{ resetToken: string; newPassword: string }>,
  ) =>
    unwrapAxios(
      "auth.resetPasswordWithToken",
      api.post("/auth/reset-password", data),
      schemas.authResetPassword,
    ),
  getSessions: () =>
    unwrapAxios("auth.getSessions", api.get("/auth/sessions"), schemas.authSessionsList),
  revokeSession: (sessionId: string) =>
    unwrapAxios(
      "auth.revokeSession",
      api.delete(`/auth/sessions/${sessionId}`),
      schemas.authMessage,
    ),
  revokeOtherSessions: () =>
    unwrapAxios(
      "auth.revokeOtherSessions",
      api.post("/auth/sessions/revoke-others"),
      schemas.authRevokeOtherSessions,
    ),
  revokeAllSessions: () =>
    unwrapAxios(
      "auth.revokeAllSessions",
      api.post("/auth/sessions/revoke-all"),
      schemas.authLogout,
    ),
  logout: () => unwrapAxios("auth.logout", api.post("/auth/logout"), schemas.authLogout),
  getMe: () => unwrapAxios("auth.getMe", api.get("/auth/me"), schemas.authMe),
  updateMe: (data: FormData) =>
    unwrapAxios("auth.updateMe", api.patch("/auth/update-me", data, { headers: { "Content-Type": "multipart/form-data" } }), schemas.authMe),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    unwrapAxios("auth.updatePassword", api.patch("/auth/update-password", data), schemas.authWithUser),
  deleteMe: () => unwrapAxios("auth.deleteMe", api.delete("/auth/delete-me"), schemas.authMessage),
  addAddress: (data: object) =>
    unwrapAxios("auth.addAddress", api.post("/auth/addresses", data), schemas.authAddresses),
  removeAddress: (addressId: string) =>
    unwrapAxios("auth.removeAddress", api.delete(`/auth/addresses/${addressId}`), schemas.authAddresses),
};

export const productApi = {
  getAll: (params?: Record<string, string | number>) =>
    unwrapAxios("products.getAll", api.get("/products", { params }), schemas.productsPaginated),
  // Advanced search endpoints
  search: (params?: Record<string, string | number>) =>
    unwrapAxios("products.search", api.get("/products/search", { params }), schemas.productsPaginated),
  autocomplete: (query: string, limit = 5) =>
    unwrapAxios("products.autocomplete", api.get("/products/autocomplete", { params: { q: query, limit } }), schemas.autocompleteResponse),
  getSearchSuggestions: (query: string) =>
    unwrapAxios("products.searchSuggestions", api.get("/products/suggestions", { params: { q: query } }), schemas.searchSuggestionsResponse),
  getTrendingSearches: (limit = 10) =>
    unwrapAxios("products.trendingSearches", api.get("/products/trending", { params: { limit } }), schemas.trendingSearchesResponse),
  // Existing endpoints
  recordView: (slug: string) =>
    unwrapAxios("products.recordView", api.post(`/products/${encodeURIComponent(slug)}/view`), schemas.viewCount),
  getBySlug: (slug: string) =>
    unwrapAxios("products.getBySlug", api.get(`/products/${slug}`), schemas.productSingle),
  getFeatured: () =>
    unwrapAxios("products.featured", api.get("/products/featured"), schemas.productsFeatured),
  getByCategory: (category: string, params?: Record<string, string | number>) =>
    unwrapAxios(
      "products.byCategory",
      api.get(`/products/category/${encodeURIComponent(category)}`, { params }),
      schemas.productsPaginated,
    ),
  getFilterOptions: (params?: { category?: string }) =>
    unwrapAxios(
      "products.filters",
      api.get("/products/filters", { params }),
      schemas.filterOptions,
    ),
  create: (
    data: FormData,
    opts?: { onUploadProgress?: (percent: number) => void },
  ) =>
    unwrapAxios(
      "products.create",
      api.post("/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (e.total && opts?.onUploadProgress) {
            opts.onUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }),
      schemas.productSingle,
    ),
  update: (
    id: string,
    data: FormData,
    opts?: { onUploadProgress?: (percent: number) => void },
  ) =>
    unwrapAxios(
      "products.update",
      api.patch(`/products/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (e.total && opts?.onUploadProgress) {
            opts.onUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }),
      schemas.productSingle,
    ),
  delete: (id: string) => del204("products.delete", api.delete(`/products/${id}`)),
  deleteImage: (id: string, publicId: string) =>
    unwrapAxios(
      "products.deleteImage",
      api.delete(`/products/${id}/images/${encodeURIComponent(publicId)}`),
      schemas.productSingle
    ),
};

function cartIdempotencyConfig(idempotencyKey?: string) {
  if (!idempotencyKey) return {};
  return {
    headers: { "Idempotency-Key": idempotencyKey },
  };
}

export const cartApi = {
  get: () => unwrapAxios("cart.get", api.get("/cart"), schemas.cartPayload),
  add: (
    data: {
      productId: string;
      variant: object;
      quantity: number;
      customFieldAnswers?: Array<{ label: string; value: string }>;
    },
    opts?: { idempotencyKey?: string },
  ) =>
    unwrapAxios(
      "cart.add",
      api.post(
        "/cart/add",
        { ...data, ...(opts?.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}) },
        cartIdempotencyConfig(opts?.idempotencyKey),
      ),
      schemas.cartPayload,
    ),
  update: (cartItemId: string, quantity: number, opts?: { idempotencyKey?: string }) =>
    unwrapAxios(
      "cart.update",
      api.patch(
        `/cart/item/${cartItemId}`,
        { quantity, ...(opts?.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}) },
        cartIdempotencyConfig(opts?.idempotencyKey),
      ),
      schemas.cartPayload,
    ),
  remove: (cartItemId: string) =>
    unwrapAxios("cart.remove", api.delete(`/cart/item/${cartItemId}`), schemas.cartPayload),
  clear: () => unwrapAxios("cart.clear", api.delete("/cart"), schemas.cartClear),
  applyCoupon: (couponCode: string, opts?: { idempotencyKey?: string }) =>
    unwrapAxios(
      "cart.applyCoupon",
      api.post(
        "/cart/apply-coupon",
        { couponCode, ...(opts?.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}) },
        cartIdempotencyConfig(opts?.idempotencyKey),
      ),
      schemas.cartPayload,
    ),
  removeCoupon: () => unwrapAxios("cart.removeCoupon", api.delete("/cart/coupon"), schemas.cartPayload),
  uploadCustomFieldImage: (data: FormData) =>
    unwrapAxios(
      "cart.customFieldImage",
      api.post("/cart/custom-field-image", data, { headers: { "Content-Type": "multipart/form-data" } }),
      schemas.successMessageData,
    ),
};

export const orderApi = {
  create: (data: object, opts?: { idempotencyKey?: string }) =>
    unwrapAxios(
      "orders.create",
      api.post("/orders", data, {
        headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : {},
      }),
      schemas.orderCreateResponse,
    ),
  verifyPayment: (data: object) =>
    unwrapAxios("orders.verifyPayment", api.post("/orders/verify-payment", data), schemas.orderSingle),
  getMyOrders: (params?: object) =>
    unwrapAxios("orders.myOrders", api.get("/orders/my-orders", { params }), schemas.ordersMyList),
  getById: (id: string) => unwrapAxios("orders.getById", api.get(`/orders/${id}`), schemas.orderSingle),
  preparePayment: (orderId: string) =>
    unwrapAxios(
      "orders.preparePayment",
      api.post(`/orders/${orderId}/prepare-payment`),
      schemas.orderPreparePayment,
    ),
  cancel: (id: string, reason?: string) =>
    unwrapAxios("orders.cancel", api.patch(`/orders/${id}/cancel`, { reason }), schemas.orderSingle),
  requestReturn: (id: string, reason: string, note?: string, refundMethod?: string, userBankDetails?: Record<string, string>) =>
    unwrapAxios("orders.requestReturn", api.post(`/orders/${id}/return`, { reason, note, refundMethod, userBankDetails }), schemas.orderSingle),
};

export const reviewApi = {
  getFeatured: () => unwrapAxios("reviews.featured", api.get("/reviews/featured"), schemas.reviewsFeatured),
  getProductReviews: (productId: string, params?: object) =>
    unwrapAxios("reviews.product", api.get(`/reviews/product/${productId}`, { params }), schemas.reviewsProduct),
  canReview: (productId: string) =>
    unwrapAxios("reviews.canReview", api.get(`/reviews/product/${productId}/can-review`), schemas.canReview),
  /** Share-link / QR — no login. Pending until admin approves. */
  submitPublic: (data: FormData) =>
    unwrapAxios(
      "reviews.submitPublic",
      api.post("/reviews/submit-public", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      }),
      schemas.successData,
    ),
  create: (productId: string, data: FormData) =>
    unwrapAxios(
      "reviews.create",
      api.post(`/reviews/product/${productId}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
      schemas.reviewSingle,
    ),
  update: (id: string, data: object) =>
    unwrapAxios("reviews.update", api.patch(`/reviews/${id}`, data), schemas.reviewSingle),
  delete: (id: string) => del204("reviews.delete", api.delete(`/reviews/${id}`)),
  voteHelpful: (id: string) =>
    unwrapAxios("reviews.vote", api.patch(`/reviews/${id}/helpful`), schemas.reviewVote),
  report: (id: string, data: { reason: "spam" | "abusive" | "misleading" | "other"; details?: string }) =>
    unwrapAxios("reviews.report", api.patch(`/reviews/${id}/report`, data), schemas.successMessageData),
};

export const reviewInviteApi = {
  get: (token: string) =>
    unwrapAxios(
      "reviewInvite.get",
      api.get(`/review-invites/${encodeURIComponent(token)}`),
      schemas.successData,
    ),
  submit: (token: string, data: FormData) =>
    unwrapAxios(
      "reviewInvite.submit",
      api.post(`/review-invites/${encodeURIComponent(token)}/submit`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      }),
      schemas.successData,
    ),
};

export const testimonialApi = {
  getPublic: () =>
    unwrapAxios("testimonials.public", api.get("/testimonials"), schemas.testimonialsList),
  /** Share-link form — no auth required */
  submitPublic: (data: FormData) =>
    unwrapAxios(
      "testimonials.submit",
      api.post("/testimonials/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      }),
      schemas.successData,
    ),
  getAdminAll: () =>
    unwrapAxios("testimonials.admin", api.get("/testimonials/admin"), schemas.testimonialsList),
  create: (data: FormData) =>
    unwrapAxios(
      "testimonials.create",
      api.post("/testimonials", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      }),
      schemas.successData,
    ),
  update: (id: string, data: FormData) =>
    unwrapAxios(
      "testimonials.update",
      api.patch(`/testimonials/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      }),
      schemas.successData,
    ),
  approve: (id: string) =>
    unwrapAxios("testimonials.approve", api.patch(`/testimonials/${id}/approve`), schemas.successData),
  reject: (id: string) =>
    unwrapAxios("testimonials.reject", api.patch(`/testimonials/${id}/reject`), schemas.successData),
  delete: (id: string) => del204("testimonials.delete", api.delete(`/testimonials/${id}`)),
};

export const wishlistApi = {
  get: () => unwrapAxios("wishlist.get", api.get("/wishlist"), schemas.wishlistGet),
  toggle: (productId: string) =>
    unwrapAxios("wishlist.toggle", api.post(`/wishlist/${productId}`), schemas.wishlistToggle),
};

export const couponApi = {
  validate: (code: string, orderAmount: number, items?: Array<{ productId: string; price: number; quantity: number }>) =>
    unwrapAxios("coupons.validate", api.post("/coupons/validate", { code, orderAmount, items }), schemas.couponValidate),
  getEligible: (
    orderAmount: number,
    items?: Array<{ productId: string; price: number; quantity: number }>,
  ) =>
    unwrapAxios(
      "coupons.eligible",
      api.get("/coupons/eligible", {
        params: {
          orderAmount,
          ...(items?.length ? { items: JSON.stringify(items) } : {}),
        },
      }),
      schemas.couponEligible,
    ),
  getPublic: () =>
    unwrapAxios("coupons.public", api.get("/coupons/public"), schemas.couponsPublicList),
  create: (data: object | FormData) =>
    unwrapAxios(
      "coupons.create",
      data instanceof FormData
        ? api.post("/coupons", data, { headers: { "Content-Type": "multipart/form-data" } })
        : api.post("/coupons", data),
      schemas.successData,
    ),
  getAll: () => unwrapAxios("coupons.getAll", api.get("/coupons"), schemas.couponsAdminList),
  update: (id: string, data: object | FormData) =>
    unwrapAxios(
      "coupons.update",
      data instanceof FormData
        ? api.patch(`/coupons/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } })
        : api.patch(`/coupons/${id}`, data),
      schemas.successData,
    ),
  archive: (id: string) =>
    unwrapAxios("coupons.archive", api.patch(`/coupons/${id}/archive`), schemas.successData),
  delete: (id: string) => del204("coupons.delete", api.delete(`/coupons/${id}`)),
};

export const saleCampaignApi = {
  getPublic: () =>
    unwrapAxios("sales.public", api.get("/sales/public"), schemas.salesPublicList),
  getAll: () => unwrapAxios("sales.getAll", api.get("/sales"), schemas.saleCampaignsList),
  getById: (id: string) => unwrapAxios("sales.getById", api.get(`/sales/${id}`), schemas.successData),
  create: (data: object | FormData) =>
    unwrapAxios(
      "sales.create",
      data instanceof FormData
        ? api.post("/sales", data, { headers: { "Content-Type": "multipart/form-data" } })
        : api.post("/sales", data),
      schemas.successData,
    ),
  update: (id: string, data: object | FormData) =>
    unwrapAxios(
      "sales.update",
      data instanceof FormData
        ? api.patch(`/sales/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } })
        : api.patch(`/sales/${id}`, data),
      schemas.successData,
    ),
  archive: (id: string) =>
    unwrapAxios("sales.archive", api.patch(`/sales/${id}/archive`), schemas.successData),
  delete: (id: string) => del204("sales.delete", api.delete(`/sales/${id}`)),
  preview: (data: object) =>
    unwrapAxios("sales.preview", api.post("/sales/preview", data), schemas.successData),
};

export const categoryApi = {
  getAll: (params?: { active?: boolean }) =>
    unwrapAxios("categories.getAll", api.get("/categories", { params }), schemas.categoriesList),
  getStats: () => unwrapAxios("categories.stats", api.get("/categories/stats"), schemas.categoryStats),
  getById: (id: string) => unwrapAxios("categories.getById", api.get(`/categories/${id}`), schemas.categorySingle),
  getSubcategories: (categorySlug: string) => 
    unwrapAxios("categories.getSubcategories", api.get(`/categories/slug/${categorySlug}/subcategories`), schemas.subcategoriesList),
};

export const navigationApi = {
  getMegaMenu: () =>
    unwrapAxios("navigation.megaMenu", api.get("/navigation/mega-menu"), schemas.megaMenu),
};

export const collectionApi = {
  getCollection: (catSlug: string) =>
    unwrapAxios("collections.getCollection", api.get(`/collections/${catSlug}`), schemas.looseDataResponse),
  getCollectionProducts: (catSlug: string, params?: Record<string, string | number>) =>
    unwrapAxios("collections.getProducts", api.get(`/collections/${catSlug}/products`, { params }), schemas.productsPaginated),
  getSubcollection: (catSlug: string, subSlug: string) =>
    unwrapAxios("collections.getSubcollection", api.get(`/collections/${catSlug}/${subSlug}`), schemas.looseDataResponse),
  getSubcollectionProducts: (catSlug: string, subSlug: string, params?: Record<string, string | number>) =>
    unwrapAxios("collections.getSubcollectionProducts", api.get(`/collections/${catSlug}/${subSlug}/products`, { params }), schemas.productsPaginated),
};

export const storefrontApi = {
  getSettings: async () => {
    const now = Date.now();
    if (storefrontSettingsCache && now < storefrontSettingsCache.expiresAt) {
      return storefrontSettingsCache.value;
    }
    if (storefrontSettingsInFlight) {
      return storefrontSettingsInFlight;
    }
    storefrontSettingsInFlight = unwrapAxios(
      "storefront.settings",
      api.get("/storefront/settings"),
      schemas.storefrontSettings,
    )
      .then((body) => {
        storefrontSettingsCache = {
          value: body,
          expiresAt: Date.now() + STOREFRONT_SETTINGS_CLIENT_CACHE_MS,
        };
        return body;
      })
      .finally(() => {
        storefrontSettingsInFlight = null;
      });
    return storefrontSettingsInFlight;
  },
  recordVisit: (data: {
    sessionKey: string;
    path?: string;
    referrer?: string;
    marketingAttribution?: {
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      utmTerm?: string;
      fbclid?: string;
      landingPath?: string;
      capturedAt?: string;
    };
  }) =>
    unwrapAxios(
      'storefront.visit',
      api.post('/storefront/visit', data),
      schemas.storeVisitRecorded,
    ),
};

export const adminApi = {
  getProducts: (params?: Record<string, string | number | boolean | undefined>) =>
    unwrapAxios("admin.products", api.get("/admin/products", { params }), schemas.productsPaginated),
  getProductById: (id: string) =>
    unwrapAxios(
      "admin.productById",
      api.get(`/admin/products/${id}`),
      schemas.productSingle,
    ),
  searchProducts: (params?: Record<string, string | number | boolean | undefined>) =>
    unwrapAxios("admin.products.search", api.get("/admin/products/search", { params }), schemas.productsPaginated),
  getAnalytics: () => unwrapAxios("admin.analytics", api.get("/admin/analytics"), schemas.adminAnalytics),
  getRevenueSummary: (params: { period: string; year?: number; month?: number }) =>
    unwrapAxios("admin.revenueSummary", api.get("/admin/revenue/summary", { params }), schemas.adminAnalytics),
  getAuditLogs: (params?: Record<string, string | number>) =>
    unwrapAxios("admin.auditLogs", api.get("/admin/security/audit", { params }), schemas.adminAuditLogsList),
  getOrders: (params?: object) =>
    unwrapAxios("admin.orders", api.get("/admin/orders", { params }), schemas.adminOrdersList),
  getOrderDetails: (id: string) =>
    unwrapAxios("admin.orderDetail", api.get(`/admin/orders/${id}`), schemas.adminOrderDetail),
  createReviewInvite: (orderId: string) =>
    unwrapAxios(
      "admin.reviewInvite.create",
      api.post(`/admin/orders/${orderId}/review-invite`),
      schemas.successData,
    ),
  emailReviewInvite: (orderId: string) =>
    unwrapAxios(
      "admin.reviewInvite.email",
      api.post(`/admin/orders/${orderId}/review-invite/email`),
      schemas.successData,
    ),
  deleteOrder: (id: string) =>
    del204("admin.deleteOrder", api.delete(`/admin/orders/${id}`)),
  createOfflineOrder: (data: AdminCreateOfflineOrderBody) =>
    unwrapAxios("admin.createOfflineOrder", api.post("/admin/orders/offline", data), schemas.adminOrderDetail),
  updateOrderStatus: (
    id: string,
    payload: {
      status: string;
      note?: string;
      shippingCarrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    },
  ) => unwrapAxios("admin.orderStatus", api.patch(`/admin/orders/${id}/status`, payload), schemas.adminOrderDetail),
  generateOrderInvoice: (id: string) =>
    unwrapAxios("admin.generateInvoice", api.post(`/admin/orders/${id}/generate-invoice`), schemas.successMessageData),
  processRefund: (
    id: string,
    payload: { refundMethod?: string; amount: number; notes?: string }
  ) => unwrapAxios("admin.processRefund", api.post(`/admin/orders/${id}/refund`, payload), schemas.adminOrderDetail),
  getUsers: (params?: object) =>
    unwrapAxios("admin.users", api.get("/admin/users", { params }), schemas.adminUsersList),
  getOfflineCustomers: (params?: { page?: number; limit?: number }) =>
    unwrapAxios(
      "admin.offlineCustomers",
      api.get("/admin/offline-customers", { params }),
      schemas.adminOfflineCustomersList,
    ),
  getNewsletterSubscribers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: "true" | "false" | "all";
  }) =>
    unwrapAxios(
      "admin.newsletterSubscribers",
      api.get("/admin/newsletter-subscribers", { params }),
      schemas.adminNewsletterSubscribersList,
    ),
  getUserDirectoryStats: () =>
    unwrapAxios("admin.userDirectoryStats", api.get("/admin/users/stats"), schemas.adminUserDirectoryStats),
  getUserInsights: (id: string) =>
    unwrapAxios("admin.userInsights", api.get(`/admin/users/${id}/insights`), schemas.adminUserInsights),
  toggleUserStatus: (id: string) =>
    unwrapAxios("admin.toggleUser", api.patch(`/admin/users/${id}/toggle-status`), schemas.adminToggleUser),
  updateUserNote: (id: string, note: string) =>
    unwrapAxios("admin.updateUserNote", api.patch(`/admin/users/${id}/note`, { note }), schemas.adminUpdateUserNote),
  updateUserRole: (id: string, role: "user" | "admin") =>
    unwrapAxios(
      "admin.updateUserRole",
      api.patch(`/admin/users/${id}/role`, { role }),
      schemas.adminUpdateUserRole
    ),
  getReviews: (params?: object) =>
    unwrapAxios("admin.reviews", api.get("/admin/reviews", { params }), schemas.adminReviewsList),
  deleteReview: (id: string) => del204("admin.deleteReview", api.delete(`/admin/reviews/${id}`)),
  replyToReview: (id: string, text: string) =>
    unwrapAxios("admin.replyReview", api.patch(`/admin/reviews/${id}/reply`, { text }), schemas.reviewSingle),
  moderateReview: (id: string, action: "approve" | "hide" | "restore") =>
    unwrapAxios(
      "admin.moderateReview",
      api.patch(`/admin/reviews/${id}/moderate`, { action }),
      schemas.reviewSingle,
    ),
  getMarketingAudiencePreview: (params: {
    audience: "all" | "users" | "admins" | "selected";
    channels: string;
    includeOfflineLeads?: boolean;
  }) =>
    unwrapAxios(
      "admin.marketingPreview",
      api.get("/admin/emails/audience-preview", { params }),
      schemas.marketingAudiencePreview,
    ),
  sendMarketingEmail: (data: {
    subject: string;
    messageHtml: string;
    audience: "all" | "users" | "admins" | "selected";
    userIds?: string[];
    ctaText?: string;
    ctaLink?: string;
    channels?: Array<"email" | "in_app" | "push">;
    includeOfflineLeads?: boolean;
  }) => unwrapAxios("admin.email", api.post("/admin/emails/send", data), schemas.successMessageData),
  getStorefrontSettings: () =>
    unwrapAxios("admin.storefront.get", api.get("/admin/storefront/settings"), schemas.adminStorefront),
  updateStorefrontSettings: (data: object | FormData) =>
    data instanceof FormData
      ? unwrapAxios(
          "admin.storefront.patch",
          api.patch("/admin/storefront/settings", data, { headers: { "Content-Type": "multipart/form-data" } }),
          schemas.adminStorefront,
        )
      : unwrapAxios("admin.storefront.patch", api.patch("/admin/storefront/settings", data), schemas.adminStorefront),
  getCategories: (params?: object) =>
    unwrapAxios("admin.categories", api.get("/admin/categories", { params }), schemas.adminCategoriesList),
  createCategory: (data: FormData) =>
    unwrapAxios(
      "admin.categories.create",
      api.post("/admin/categories", data, { headers: { "Content-Type": "multipart/form-data" } }),
      schemas.categorySingle,
    ),
  updateCategory: (id: string, data: FormData) =>
    unwrapAxios(
      "admin.categories.update",
      api.patch(`/admin/categories/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
      schemas.categorySingle,
    ),
  deleteCategory: (id: string) => del204("admin.categories.delete", api.delete(`/admin/categories/${id}`)),
  getSubcategories: (params?: object) =>
    unwrapAxios("admin.subcategories", api.get("/admin/subcategories", { params }), schemas.subcategoriesList),
  createSubcategory: (data: object) =>
    unwrapAxios("admin.subcategories.create", api.post("/admin/subcategories", data), schemas.subcategorySingle),
  updateSubcategory: (id: string, data: object) =>
    unwrapAxios("admin.subcategories.update", api.patch(`/admin/subcategories/${id}`, data), schemas.subcategorySingle),
  deleteSubcategory: (id: string) => del204("admin.subcategories.delete", api.delete(`/admin/subcategories/${id}`)),
  /* ── Sales invoices (B2B / bulk-order tax invoices) ── */
  listSalesInvoices: (params?: { page?: number; limit?: number; search?: string }) =>
    unwrapAxios(
      "admin.invoices.list",
      api.get("/admin/invoices", { params }),
      schemas.adminSalesInvoiceList,
    ),
  getSalesInvoice: (id: string) =>
    unwrapAxios(
      "admin.invoices.get",
      api.get(`/admin/invoices/${id}`),
      schemas.adminSalesInvoiceSingle,
    ),
  createSalesInvoice: (payload: AdminSalesInvoiceWriteBody) =>
    unwrapAxios(
      "admin.invoices.create",
      api.post("/admin/invoices", payload),
      schemas.adminSalesInvoiceSingle,
    ),
  updateSalesInvoice: (id: string, payload: AdminSalesInvoiceWriteBody) =>
    unwrapAxios(
      "admin.invoices.update",
      api.put(`/admin/invoices/${id}`, payload),
      schemas.adminSalesInvoiceSingle,
    ),
  deleteSalesInvoice: (id: string) =>
    unwrapAxios(
      "admin.invoices.delete",
      api.delete(`/admin/invoices/${id}`),
      schemas.successMessageData,
    ),
  getReturns: (params?: object) =>
    unwrapAxios("admin.returns", api.get("/admin/returns", { params }), schemas.adminOrdersList),
  getReturnsInsights: () =>
    unwrapAxios("admin.returnsInsights", api.get("/admin/returns/insights"), schemas.adminReturnsInsights),
  resolveReturn: (id: string, payload: { action: 'approve' | 'reject'; adminNote?: string }) =>
    unwrapAxios("admin.resolveReturn", api.patch(`/admin/orders/${id}/return/resolve`, payload), schemas.adminOrderDetail),

  getDelhiveryStatus: () =>
    unwrapAxios("admin.delhiveryStatus", api.get("/admin/delhivery/status"), schemas.delhiveryStatus),
  checkDelhiveryPin: (orderId: string) =>
    unwrapAxios(
      "admin.delhiveryPin",
      api.get(`/admin/orders/${orderId}/delhivery/pin-check`),
      schemas.delhiveryPinCheck,
    ),
  /** Delhivery: check if any 6-digit PIN is serviceable (not tied to an order). */
  checkDelhiveryServiceability: (pin: string) =>
    unwrapAxios(
      "admin.delhiveryServiceability",
      api.get("/admin/delhivery/serviceability", { params: { pin: pin.replace(/\D/g, "").slice(0, 6) } }),
      schemas.delhiveryServiceability,
    ),
  estimateDelhivery: (
    orderId: string,
    payload: {
      md: "E" | "S";
      lengthCm: number;
      breadthCm: number;
      heightCm: number;
      weightGm: number;
      boxCount?: number;
      ipkg_type?: "box" | "flyer";
    },
  ) =>
    unwrapAxios(
      "admin.delhiveryEstimate",
      api.post(`/admin/orders/${orderId}/delhivery/estimate`, payload),
      schemas.delhiveryEstimate,
    ),
  createDelhiveryShipment: (
    orderId: string,
    payload: {
      shippingMode: "Surface" | "Express";
      lengthCm: number;
      breadthCm: number;
      heightCm: number;
      weightGm: number;
      boxCount?: number;
      ipkg_type?: "box" | "flyer";
    },
  ) =>
    unwrapAxios(
      "admin.delhiveryCreate",
      api.post(`/admin/orders/${orderId}/delhivery/create-shipment`, payload),
      schemas.adminOrderDetail,
    ),
  syncDelhiveryTracking: (orderId: string) =>
    unwrapAxios(
      "admin.delhiverySync",
      api.post(`/admin/orders/${orderId}/delhivery/sync-tracking`),
      schemas.adminDelhiveryTrackSync,
    ),
  /** JSON with S3 URL (e.g. integrations). Prefer downloadDelhiveryPackingSlipFile for browser. */
  getDelhiveryPackingSlip: (orderId: string, params?: { pdf_size?: '4R' | 'A4' }) =>
    unwrapAxios(
      "admin.delhiveryPackingSlip",
      api.get(`/admin/orders/${orderId}/delhivery/packing-slip`, {
        params: params?.pdf_size ? { pdf_size: params.pdf_size } : {},
        timeout: 120_000,
      }),
      schemas.delhiveryPackingSlip,
    ),
  /** Delhivery packing slip with pdf=false — JSON for custom layouts (Code 128, etc.). */
  getDelhiveryPackingSlipJson: (orderId: string, params?: { pdf_size?: '4R' | 'A4' }) =>
    unwrapAxios(
      'admin.delhiveryPackingSlipJson',
      api.get(`/admin/orders/${orderId}/delhivery/packing-slip/json`, {
        params: params?.pdf_size ? { pdf_size: params.pdf_size } : {},
        timeout: 120_000,
      }),
      schemas.delhiveryPackingSlipJson,
    ),
  /** Proxied PDF bytes — same file every time; no wrong tab / tracking link. */
  downloadDelhiveryPackingSlipFile: async (
    orderId: string,
    params?: { pdf_size?: "4R" | "A4" },
  ): Promise<Blob> => {
    const res = await api.get(`/admin/orders/${orderId}/delhivery/packing-slip/file`, {
      params: params?.pdf_size ? { pdf_size: params.pdf_size } : {},
      responseType: "blob",
      timeout: 120_000,
    });
    const blob = res.data as Blob;
    if (blob.type.includes("application/json")) {
      const text = await blob.text();
      let msg = "Could not download label PDF.";
      try {
        const j = JSON.parse(text) as { message?: string };
        if (j?.message) msg = j.message;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    return blob;
  },
};

/** @see adminAiApi — AI calls live in a separate module to avoid Webpack/HMR dropping nested adminApi methods. */
export { adminAiApi } from "@/lib/adminAiApi";

export const inventoryApi = {
  getOverview: (params?: Record<string, string | number>) =>
    unwrapAxios('inventory.overview', api.get('/admin/inventory', { params }), schemas.adminInventoryOverview),
  adjustStock: (productId: string, sku: string, payload: { delta: number; reason: string; note?: string; costPrice?: number; price?: number }) =>
    unwrapAxios('inventory.adjustStock', api.patch(`/admin/inventory/products/${productId}/variants/${encodeURIComponent(sku)}/stock`, payload), schemas.successMessageData),
  getLedger: (params?: Record<string, string | number>) =>
    unwrapAxios('inventory.ledger', api.get('/admin/inventory/ledger', { params }), schemas.adminStockLedger),
  getValuation: () =>
    unwrapAxios('inventory.valuation', api.get('/admin/inventory/valuation'), schemas.adminInventoryValuation),
  listPurchaseInvoices: (params?: Record<string, string | number>) =>
    unwrapAxios('inventory.purchaseInvoices', api.get('/admin/inventory/purchase-invoices', { params }), schemas.adminPurchaseInvoiceList),
  getPurchaseInvoice: (id: string) =>
    unwrapAxios('inventory.purchaseInvoice', api.get(`/admin/inventory/purchase-invoices/${id}`), schemas.adminPurchaseInvoiceSingle),
  createPurchaseInvoice: (payload: Record<string, unknown>) =>
    unwrapAxios('inventory.createPurchaseInvoice', api.post('/admin/inventory/purchase-invoices', payload), schemas.adminPurchaseInvoiceSingle),
  updatePurchaseInvoice: (id: string, payload: Record<string, unknown>) =>
    unwrapAxios('inventory.updatePurchaseInvoice', api.put(`/admin/inventory/purchase-invoices/${id}`, payload), schemas.adminPurchaseInvoiceSingle),
  deletePurchaseInvoice: (id: string) =>
    del204('inventory.deletePurchaseInvoice', api.delete(`/admin/inventory/purchase-invoices/${id}`)),
  getGstSummary: (params?: { year?: number; month?: string; quarter?: string }) =>
    unwrapAxios('inventory.gstSummary', api.get('/admin/inventory/gst-summary', { params }), schemas.adminGstSummary),
};

export const operatingExpensesApi = {
  list: (params?: Record<string, string | number>) =>
    unwrapAxios('operatingExpenses.list', api.get('/admin/operating-expenses', { params }), schemas.adminOperatingExpenseList),
  getSummary: (params?: { year?: number }) =>
    unwrapAxios('operatingExpenses.summary', api.get('/admin/operating-expenses/summary', { params }), schemas.adminOperatingExpenseSummary),
  create: (payload: Record<string, unknown>) =>
    unwrapAxios('operatingExpenses.create', api.post('/admin/operating-expenses', payload), schemas.adminOperatingExpenseSingle),
  update: (id: string, payload: Record<string, unknown>) =>
    unwrapAxios('operatingExpenses.update', api.put(`/admin/operating-expenses/${id}`, payload), schemas.adminOperatingExpenseSingle),
  void: (id: string) =>
    del204('operatingExpenses.void', api.delete(`/admin/operating-expenses/${id}`)),
};

export const blogApi = {
  getAll: (params?: Record<string, string | number | boolean>) => 
    unwrapAxios("blogs.getAll", api.get("/blogs", { params }), schemas.blogsPaginated),
  getBySlug: (slug: string) => 
    unwrapAxios("blogs.getBySlug", api.get(`/blogs/${slug}`), schemas.blogSingle),
  getRelated: (slug: string) =>
    unwrapAxios("blogs.getRelated", api.get(`/blogs/${slug}/related`), schemas.blogsPaginated),
  trackShopClick: (slug: string, productSlug?: string) =>
    unwrapAxios(
      "blogs.trackShopClick",
      api.post(`/blogs/${slug}/track-shop-click`, { productSlug }),
      schemas.successData,
    ),
  getAnalytics: () =>
    unwrapAxios("blogs.analytics", api.get("/blogs/admin/analytics"), schemas.looseDataResponse),
  like: (id: string) => 
    unwrapAxios("blogs.like", api.post(`/blogs/${id}/like`), schemas.successData),
  addComment: (id: string, content: string) => 
    unwrapAxios("blogs.addComment", api.post(`/blogs/${id}/comments`, { content }), schemas.successData),
  getAdminAll: (params?: Record<string, string | number>) => 
    unwrapAxios("blogs.getAdminAll", api.get("/blogs/admin/all", { params }), schemas.blogsPaginated),
  create: (
    data: FormData,
    opts?: { onUploadProgress?: (percent: number) => void },
  ) =>
    unwrapAxios(
      "blogs.create",
      api.post("/blogs", data, {
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (e.total && opts?.onUploadProgress) {
            opts.onUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }),
      schemas.blogSingle,
    ),
  update: (
    id: string,
    data: FormData,
    opts?: { onUploadProgress?: (percent: number) => void },
  ) =>
    unwrapAxios(
      "blogs.update",
      api.patch(`/blogs/${id}`, data, {
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (e.total && opts?.onUploadProgress) {
            opts.onUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }),
      schemas.blogSingle,
    ),
  delete: (id: string) => del204("blogs.delete", api.delete(`/blogs/${id}`)),
  deleteImage: (id: string, publicId: string) => 
    unwrapAxios(
      "blogs.deleteImage",
      api.delete(`/blogs/${id}/images/${encodeURIComponent(publicId)}`),
      schemas.successData,
    ),
  deleteComment: (id: string, commentId: string) => 
    unwrapAxios("blogs.deleteComment", api.delete(`/blogs/${id}/comments/${commentId}`), schemas.successData),
};

export const newsletterApi = {
  subscribe: (email: string, source: "blog_listing" | "blog_detail" = "blog_listing") =>
    unwrapAxios(
      "newsletter.subscribe",
      api.post("/newsletter/subscribe", { email, source }),
      schemas.newsletterSubscribeResponse,
    ),
};

export const blogContentPlanApi = {
  getAll: (params?: Record<string, string>) =>
    unwrapAxios("blogPlans.list", api.get("/admin/blog-content-plans", { params }), schemas.looseDataResponse),
  create: (body: Record<string, unknown>) =>
    unwrapAxios("blogPlans.create", api.post("/admin/blog-content-plans", body), schemas.looseDataResponse),
  bulkCreate: (items: Record<string, unknown>[]) =>
    unwrapAxios(
      "blogPlans.bulk",
      api.post("/admin/blog-content-plans/bulk", { items }),
      schemas.looseDataResponse,
    ),
  update: (id: string, body: Record<string, unknown>) =>
    unwrapAxios("blogPlans.update", api.patch(`/admin/blog-content-plans/${id}`, body), schemas.looseDataResponse),
  delete: (id: string) => del204("blogPlans.delete", api.delete(`/admin/blog-content-plans/${id}`)),
};

export const notificationApi = {
  getAll: (params?: Record<string, string | number | boolean>) => 
    unwrapAxios("notifications.getAll", api.get("/notifications", { params }), schemas.notificationsList),
  markAsRead: (id: string) => 
    unwrapAxios("notifications.markAsRead", api.patch(`/notifications/${id}/read`), schemas.notificationSingle),
  markAllAsRead: () => 
    unwrapAxios("notifications.markAllAsRead", api.patch("/notifications/mark-all-read"), schemas.successData),
  clearAll: () => 
    unwrapAxios("notifications.clearAll", api.delete("/notifications/clear-all"), schemas.successData),
  getPushPublicKey: () =>
    unwrapAxios("notifications.pushPublicKey", api.get("/notifications/push/public-key"), schemas.pushPublicKey),
  subscribePush: (subscription: PushSubscriptionJSON) =>
    unwrapAxios("notifications.subscribePush", api.post("/notifications/push/subscribe", { subscription }), schemas.successData),
  unsubscribePush: (endpoint: string) =>
    unwrapAxios("notifications.unsubscribePush", api.post("/notifications/push/unsubscribe", { endpoint }), schemas.successData),
  sendTestPushToSelf: () =>
    unwrapAxios("notifications.sendTestPushToSelf", api.post("/notifications/push/test-self"), schemas.successData),
  getPreferences: () =>
    unwrapAxios(
      "notifications.getPreferences",
      api.get("/notifications/preferences"),
      schemas.notificationPreferencesResponse
    ),
  updatePreferences: (body: {
    pushOptIn?: boolean;
    mutedCategories?: string[];
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  }) =>
    unwrapAxios(
      "notifications.updatePreferences",
      api.patch("/notifications/preferences", body),
      schemas.notificationPreferencesResponse
    ),
};

export const giftingApi = {
  getProducts: (params?: Record<string, string | number>) => 
    unwrapAxios("gifting.getProducts", api.get("/gifting/products", { params }), schemas.giftingProductsList),
  getCategories: () => 
    unwrapAxios("gifting.getCategories", api.get("/gifting/categories"), schemas.categoriesList),
  submitRequest: (data: FormData | Record<string, unknown>) =>
    data instanceof FormData
      ? unwrapAxios("gifting.submitRequest", api.post("/gifting/requests", data, { headers: { "Content-Type": "multipart/form-data" } }), schemas.giftingRequestSingle)
      : unwrapAxios("gifting.submitRequest", api.post("/gifting/requests", data), schemas.giftingRequestSingle),
  getMyRequests: (params?: Record<string, string | number>) => 
    unwrapAxios("gifting.getMyRequests", api.get("/gifting/my-requests", { params }), schemas.giftingRequestsList),
  getRequestById: (id: string) => 
    unwrapAxios("gifting.getRequestById", api.get(`/gifting/requests/${id}`), schemas.giftingRequestSingle),
  respondToQuote: (id: string, action: 'accept' | 'reject', shippingAddress?: Record<string, string>) =>
    unwrapAxios("gifting.respondToQuote", api.post(`/gifting/requests/${id}/respond`, { action, shippingAddress }), schemas.giftingRequestSingle),
  // Admin
  getRequests: (params?: Record<string, string | number>) => 
    unwrapAxios("gifting.getRequests", api.get("/gifting/requests", { params }), schemas.giftingRequestsList),
  updateRequest: (id: string, data: Record<string, unknown>) => 
    unwrapAxios("gifting.updateRequest", api.patch(`/gifting/requests/${id}`, data), schemas.giftingRequestSingle),
};

export const raniCareApi = {
  getStatus: () =>
    unwrapAxios("raniCare.status", api.get("/rani-care/status"), schemas.raniCareStatus),
  chat: (body: {
    message: string;
    isAuthenticated?: boolean;
    localIntent?: string;
    recentMessages?: Array<{ role: "user" | "bot"; text: string }>;
  }) =>
    unwrapAxios(
      "raniCare.chat",
      api.post("/rani-care/chat", body, { timeout: 32000 }),
      schemas.raniCareChatReply,
    ),
};
