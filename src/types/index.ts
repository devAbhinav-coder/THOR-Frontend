export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified?: boolean;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface ProductVariant {
  size?: string;
  color?: string;
  colorCode?: string;
  stock: number;
  sku: string;
  price?: number;
}

export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  category: string;
  subcategory?: string;
  fabric?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  totalStock: number;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  ratings: { average: number; count: number };
  /** PDP views (server-incremented) */
  viewCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  variant: {
    size?: string;
    color?: string;
    colorCode?: string;
    sku: string;
  };
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  coupon?: string | { _id: string; code: string };
  subtotal: number;
  discount: number;
  total: number;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  image: string;
  variant: { size?: string; color?: string; sku: string };
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'razorpay' | 'cod';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  total: number;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: string | { _id: string; name: string; slug?: string };
  user: { _id: string; name: string; avatar?: string };
  rating: number;
  title?: string;
  comment: string;
  images?: { url: string; publicId: string }[];
  isVerifiedPurchase: boolean;
  helpfulVotes: string[];
  adminReply?: { text: string; createdAt: string };
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  usedCount: number;
  startDate?: string;
  expiryDate: string;
  isActive: boolean;
  eligibilityType?: 'all' | 'first_order' | 'returning';
  minCompletedOrders?: number;
  maxCompletedOrders?: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  token?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    totalProducts?: number;
  };
  results?: number;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact?: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface FilterOptions {
  categories: string[];
  fabrics: string[];
  priceRange: { minPrice: number; maxPrice: number };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subcategories: string[];
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    monthRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    monthOrders: number;
    totalUsers: number;
    newUsersThisMonth: number;
    totalProducts: number;
    avgOrderValue: number;
    ordersToday: number;
    pendingFulfillmentCount: number;
    paidOrdersCount: number;
    totalReviews: number;
    reviewsThisMonth: number;
  };
  lowStockProducts: { _id: string; name: string; totalStock: number; category: string }[];
  recentOrders: Order[];
  ordersByStatus: { _id: string; count: number }[];
  revenueByMonth: { _id: { year: number; month: number }; revenue: number; orders: number }[];
  topProducts: { _id: string; name: string; image: string; totalSold: number; revenue: number }[];
  topViewedProducts: {
    _id: string;
    name: string;
    slug: string;
    image: string;
    category: string;
    views: number;
    price: number;
    ratingAvg: number;
    sold: number;
    conversionPercent: number;
  }[];
  revenueByCategory: { _id: string; revenue: number; units: number }[];
}

export interface StorefrontLink {
  label: string;
  href: string;
}

export interface HeroSlide {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  image: string;
  imagePublicId?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  isActive?: boolean;
}

export interface StorefrontSettings {
  announcementMessages: string[];
  heroSlides: HeroSlide[];
  promoBanner: {
    eyebrow?: string;
    title?: string;
    description?: string;
    backgroundImage?: string;
    backgroundImagePublicId?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    perks?: string[];
  };
  footer: {
    description?: string;
    contactAddress?: string;
    contactPhone?: string;
    contactEmail?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    youtubeUrl?: string;
    quickLinks?: StorefrontLink[];
    categoryLimit?: number;
  };
}

export interface BlogImage {
  url: string;
  publicId: string;
  caption?: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  images: BlogImage[];
  author: { _id: string; name: string; avatar?: string };
  likes: string[];
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  _id: string;
  blog: string;
  user: { _id: string; name: string; avatar?: string };
  content: string;
  createdAt: string;
  updatedAt: string;
}

