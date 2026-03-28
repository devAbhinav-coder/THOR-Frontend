import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { refreshAccessToken } from "@/lib/authRefresh";
import { env } from "@/lib/env";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { unwrapAxios, parseApiResponse } from "@/lib/parseApi";
import * as schemas from "@/lib/api-schemas";

const api: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

function isAuthPublicRequest(config: InternalAxiosRequestConfig): boolean {
  const path = config.url || "";
  return (
    path.includes("/auth/login") ||
    path.includes("/auth/signup") ||
    path.includes("/auth/google") ||
    path.includes("/auth/forgot-password") ||
    path.includes("/auth/reset-password") ||
    path.includes("/auth/refresh")
  );
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong";

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
      if (!path.startsWith("/auth")) {
        window.location.href = loginUrlWithRedirect(path);
      }
      return Promise.reject({ message: "Session expired", status: 401 });
    }

    if (status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (status === 429) {
      toast.error("Too many requests. Please slow down.");
    } else if (status && status >= 500) {
      toast.error("Server error. Please try again later.");
    }

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
    unwrapAxios("auth.google", api.post("/auth/google", data), schemas.authWithUser),
  forgotPassword: (data: { email: string }) =>
    unwrapAxios("auth.forgotPassword", api.post("/auth/forgot-password", data), schemas.authMessage),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    unwrapAxios("auth.resetPassword", api.post("/auth/reset-password", data), schemas.authResetPassword),
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
    unwrapAxios("products.deleteImage", api.delete(`/products/${id}/images/${publicId}`), schemas.productSingle),
};

export const cartApi = {
  get: () => unwrapAxios("cart.get", api.get("/cart"), schemas.cartPayload),
  add: (data: { productId: string; variant: object; quantity: number }) =>
    unwrapAxios("cart.add", api.post("/cart/add", data), schemas.cartPayload),
  update: (sku: string, quantity: number) =>
    unwrapAxios("cart.update", api.patch(`/cart/item/${sku}`, { quantity }), schemas.cartPayload),
  remove: (sku: string) =>
    unwrapAxios("cart.remove", api.delete(`/cart/item/${sku}`), schemas.cartPayload),
  clear: () => unwrapAxios("cart.clear", api.delete("/cart"), schemas.cartClear),
  applyCoupon: (couponCode: string) =>
    unwrapAxios("cart.applyCoupon", api.post("/cart/apply-coupon", { couponCode }), schemas.cartApplyCoupon),
  removeCoupon: () => unwrapAxios("cart.removeCoupon", api.delete("/cart/coupon"), schemas.cartPayload),
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
  cancel: (id: string, reason?: string) =>
    unwrapAxios("orders.cancel", api.patch(`/orders/${id}/cancel`, { reason }), schemas.orderSingle),
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
  getSettings: () => unwrapAxios("storefront.settings", api.get("/storefront/settings"), schemas.storefrontSettings),
};

export const adminApi = {
  getAnalytics: () => unwrapAxios("admin.analytics", api.get("/admin/analytics"), schemas.adminAnalytics),
  getOrders: (params?: object) =>
    unwrapAxios("admin.orders", api.get("/admin/orders", { params }), schemas.adminOrdersList),
  getOrderDetails: (id: string) =>
    unwrapAxios("admin.orderDetail", api.get(`/admin/orders/${id}`), schemas.adminOrderDetail),
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
  getUsers: (params?: object) =>
    unwrapAxios("admin.users", api.get("/admin/users", { params }), schemas.adminUsersList),
  toggleUserStatus: (id: string) =>
    unwrapAxios("admin.toggleUser", api.patch(`/admin/users/${id}/toggle-status`), schemas.adminToggleUser),
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
};

export default api;
