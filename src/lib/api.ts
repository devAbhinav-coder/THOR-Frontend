import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { refreshAccessToken } from "@/lib/authRefresh";
import { env } from "@/lib/env";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { unwrapAxios, parseApiResponse } from "@/lib/parseApi";
import * as schemas from "@/lib/api-schemas";
import {
  isAuthPublicRequest,
  isAuthMeRequest,
} from "@/lib/authRequestPaths";
import type { AdminCreateOfflineOrderBody } from "@/types";
import { toastForNonAuthHttpError } from "@/lib/httpClientToast";

const api: AxiosInstance = axios.create({
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
        delete originalRequest.headers.Authorization;
        return api(originalRequest);
      }
      const path = `${window.location.pathname}${window.location.search || ""}`;
      if (!path.startsWith("/auth") && !isAuthMeRequest(originalRequest)) {
        window.location.href = loginUrlWithRedirect(path);
      }
      return Promise.reject({ message: "Session expired", status: 401 });
    }

    toastForNonAuthHttpError(status);

    return Promise.reject({ message, status: error.response?.status });
  },
);

async function del204(label: string, promise: Promise<AxiosResponse<unknown>>): Promise<void> {
  const res = await promise;
  if (res.status === 204) return;
  parseApiResponse(label, res.data, schemas.nullDataSuccess);
}

export const authApi = {
  signupStart: (data: { name: string; email: string; password: string; phone: string }) =>
    unwrapAxios("auth.signupStart", api.post("/auth/signup/start", data), schemas.authMessage),
  signupVerify: (data: { email: string; otp: string }) =>
    unwrapAxios("auth.signupVerify", api.post("/auth/signup/verify", data), schemas.authWithUser),
  login: (data: { email: string; password: string }) =>
    unwrapAxios("auth.login", api.post("/auth/login", data), schemas.authWithUser),
  google: (data: { credential: string }) =>
    unwrapAxios(
      "auth.google",
      api.post("/auth/google", data, { timeout: 30000 }),
      schemas.authWithUser,
    ),
  forgotPassword: (data: { email: string }) =>
    unwrapAxios(
      "auth.forgotPassword",
      api.post("/auth/send-otp", { type: "forgot_password", email: data.email }),
      schemas.authMessage,
    ),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    unwrapAxios("auth.resetPassword", api.post("/auth/reset-password", data), schemas.authResetPassword),
  sendOtp: (
    data:
      | { type: "signup"; email: string; name: string; password: string; phone: string }
      | { type: "login"; email: string }
      | { type: "forgot_password"; email: string },
  ) => unwrapAxios("auth.sendOtp", api.post("/auth/send-otp", data), schemas.authMessage),
  resendOtp: (data: { email: string; type: "signup" | "login" | "forgot_password" }) =>
    unwrapAxios("auth.resendOtp", api.post("/auth/resend-otp", data), schemas.authMessage),
  verifyOtpSignup: (data: { email: string; otp: string }) =>
    unwrapAxios(
      "auth.verifyOtpSignup",
      api.post("/auth/verify-otp", { ...data, type: "signup" }),
      schemas.authWithUser,
    ),
  verifyOtpLogin: (data: { email: string; otp: string }) =>
    unwrapAxios(
      "auth.verifyOtpLogin",
      api.post("/auth/verify-otp", { ...data, type: "login" }),
      schemas.authWithUser,
    ),
  verifyOtpForgot: (data: { email: string; otp: string }) =>
    unwrapAxios(
      "auth.verifyOtpForgot",
      api.post("/auth/verify-otp", { ...data, type: "forgot_password" }),
      schemas.successMessageData,
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
  recordView: (slug: string) =>
    unwrapAxios("products.recordView", api.post(`/products/${encodeURIComponent(slug)}/view`), schemas.viewCount),
  getBySlug: (slug: string) =>
    unwrapAxios("products.getBySlug", api.get(`/products/${slug}`), schemas.productSingle),
  getFeatured: () =>
    unwrapAxios("products.featured", api.get("/products/featured"), schemas.productsPaginated),
  getByCategory: (category: string, params?: Record<string, string | number>) =>
    unwrapAxios("products.byCategory", api.get(`/products/category/${category}`, { params }), schemas.productsPaginated),
  getFilterOptions: () =>
    unwrapAxios("products.filters", api.get("/products/filters"), schemas.filterOptions),
  create: (data: FormData) =>
    unwrapAxios("products.create", api.post("/products", data, { headers: { "Content-Type": "multipart/form-data" } }), schemas.productSingle),
  update: (id: string, data: FormData) =>
    unwrapAxios("products.update", api.patch(`/products/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }), schemas.productSingle),
  delete: (id: string) => del204("products.delete", api.delete(`/products/${id}`)),
  deleteImage: (id: string, publicId: string) =>
    unwrapAxios(
      "products.deleteImage",
      api.delete(`/products/${id}/images/${encodeURIComponent(publicId)}`),
      schemas.productSingle
    ),
};

export const cartApi = {
  get: () => unwrapAxios("cart.get", api.get("/cart"), schemas.cartPayload),
  add: (data: { productId: string; variant: object; quantity: number; customFieldAnswers?: Array<{ label: string; value: string }> }) =>
    unwrapAxios("cart.add", api.post("/cart/add", data), schemas.cartPayload),
  update: (sku: string, quantity: number) =>
    unwrapAxios("cart.update", api.patch(`/cart/item/${sku}`, { quantity }), schemas.cartPayload),
  remove: (sku: string) =>
    unwrapAxios("cart.remove", api.delete(`/cart/item/${sku}`), schemas.cartPayload),
  clear: () => unwrapAxios("cart.clear", api.delete("/cart"), schemas.cartClear),
  applyCoupon: (couponCode: string) =>
    unwrapAxios("cart.applyCoupon", api.post("/cart/apply-coupon", { couponCode }), schemas.cartApplyCoupon),
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
  preparePayment: (orderId: string) => api.post(`/orders/${orderId}/prepare-payment`).then(res => res.data),
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

export const wishlistApi = {
  get: () => unwrapAxios("wishlist.get", api.get("/wishlist"), schemas.wishlistGet),
  toggle: (productId: string) =>
    unwrapAxios("wishlist.toggle", api.post(`/wishlist/${productId}`), schemas.wishlistToggle),
};

export const couponApi = {
  validate: (code: string, orderAmount: number) =>
    unwrapAxios("coupons.validate", api.post("/coupons/validate", { code, orderAmount }), schemas.couponValidate),
  getEligible: (orderAmount: number) =>
    unwrapAxios("coupons.eligible", api.get("/coupons/eligible", { params: { orderAmount } }), schemas.couponEligible),
  create: (data: object) =>
    unwrapAxios("coupons.create", api.post("/coupons", data), schemas.successData),
  getAll: () => unwrapAxios("coupons.getAll", api.get("/coupons"), schemas.couponsAdminList),
  update: (id: string, data: object) =>
    unwrapAxios("coupons.update", api.patch(`/coupons/${id}`, data), schemas.successData),
  delete: (id: string) => del204("coupons.delete", api.delete(`/coupons/${id}`)),
};

export const categoryApi = {
  getAll: (params?: { active?: boolean }) =>
    unwrapAxios("categories.getAll", api.get("/categories", { params }), schemas.categoriesList),
  getStats: () => unwrapAxios("categories.stats", api.get("/categories/stats"), schemas.categoryStats),
  getById: (id: string) => unwrapAxios("categories.getById", api.get(`/categories/${id}`), schemas.categorySingle),
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
};

export const adminApi = {
  getAnalytics: () => unwrapAxios("admin.analytics", api.get("/admin/analytics"), schemas.adminAnalytics),
  getAuditLogs: (params?: Record<string, string | number>) =>
    unwrapAxios("admin.auditLogs", api.get("/admin/security/audit", { params }), schemas.adminAuditLogsList),
  getOrders: (params?: object) =>
    unwrapAxios("admin.orders", api.get("/admin/orders", { params }), schemas.adminOrdersList),
  getOrderDetails: (id: string) =>
    unwrapAxios("admin.orderDetail", api.get(`/admin/orders/${id}`), schemas.adminOrderDetail),
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
  sendMarketingEmail: (data: {
    subject: string;
    messageHtml: string;
    audience: "all" | "users" | "admins" | "selected";
    userIds?: string[];
    ctaText?: string;
    ctaLink?: string;
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

export const blogApi = {
  getAll: (params?: Record<string, string | number | boolean>) => 
    unwrapAxios("blogs.getAll", api.get("/blogs", { params }), schemas.blogsPaginated),
  getBySlug: (slug: string) => 
    unwrapAxios("blogs.getBySlug", api.get(`/blogs/${slug}`), schemas.blogSingle),
  like: (id: string) => 
    unwrapAxios("blogs.like", api.post(`/blogs/${id}/like`), schemas.successData),
  addComment: (id: string, content: string) => 
    unwrapAxios("blogs.addComment", api.post(`/blogs/${id}/comments`, { content }), schemas.successData),
  getAdminAll: (params?: Record<string, string | number>) => 
    unwrapAxios("blogs.getAdminAll", api.get("/blogs/admin/all", { params }), schemas.blogsPaginated),
  create: (data: FormData) => 
    unwrapAxios("blogs.create", api.post("/blogs", data, { headers: { "Content-Type": "multipart/form-data" } }), schemas.blogSingle),
  update: (id: string, data: FormData) => 
    unwrapAxios("blogs.update", api.patch(`/blogs/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }), schemas.blogSingle),
  delete: (id: string) => 
    unwrapAxios("blogs.delete", api.delete(`/blogs/${id}`), schemas.successData),
  deleteImage: (id: string, publicId: string) => 
    unwrapAxios("blogs.deleteImage", api.delete(`/blogs/${id}/images/${publicId}`), schemas.successData),
  deleteComment: (id: string, commentId: string) => 
    unwrapAxios("blogs.deleteComment", api.delete(`/blogs/${id}/comments/${commentId}`), schemas.successData),
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
