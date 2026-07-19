export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified?: boolean;
  phone?: string;
  avatar?: string;
  adminNote?: string;
  addresses: Address[];
  isActive: boolean;
  createdAt: string;
}

/** POS / offline-sale marketing row (deduped by email). Removed when the customer signs up or links Google. */
export interface OfflineCustomerLead {
  email: string;
  phone: string;
  name: string;
  lastOfflineOrderAt?: string;
  offlineOrderCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  label: string;
  /** House / flat / building details (optional). */
  house?: string;
  street: string;
  /** Nearby landmark (optional). */
  landmark?: string;
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
  costPrice?: number;
}

export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
  color?: string;
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
  // Gifting
  isGiftable?: boolean;
  isCustomizable?: boolean;
  minOrderQty?: number;
  occasions?: string[];
  customFields?: {
    _id: string;
    label: string;
    placeholder?: string;
    fieldType: "text" | "textarea" | "select" | "image";
    options?: string[];
    isRequired: boolean;
  }[];
  productDetails?: { key: string; value: string }[];
  ratings: { average: number; count: number };
  /** PDP views (server-incremented) */
  viewCount?: number;
  soldCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  hsnCode?: string;
  createdAt: string;
  /** ISO timestamp for optimistic locking on admin updates */
  updatedAt?: string;
}

export interface CartItem {
  cartItemId: string;
  product: string;
  productName: string;
  productSlug: string;
  productImage: string;
  isActive: boolean;
  variant: {
    size?: string;
    color?: string;
    colorCode?: string;
    sku: string;
    stock?: number;
    price?: number;
  };
  quantity: number;
  price: number;
  customFieldAnswers?: { label: string; value: string }[]; // Gifting
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
  variant: {
    size?: string;
    color?: string;
    colorCode?: string;
    sku: string;
    stock?: number;
    price?: number;
  };
  quantity: number;
  price: number;
  customFieldAnswers?: { label: string; value: string }[]; // Gifting
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

/** Admin POS / stall recording — POST /admin/orders/offline */
export interface AdminCreateOfflineOrderBody {
  customerName: string;
  email?: string;
  phone?: string;
  orderSource: 'stall' | 'personal_contact';
  fulfillment: 'delhivery' | 'offline_handover';
  paymentMethod: 'offline_upi' | 'offline_cash';
  shippingAddress?: {
    name?: string;
    phone?: string;
    house?: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  lineItems: Array<
    | { type: 'catalog'; productId: string; variantSku: string; quantity: number; unitPrice?: number }
    | {
        type: 'manual';
        categoryId?: string;
        title?: string;
        quantity: number;
        unitPrice: number;
      }
  >;
  notes?: string;
}

/* ── Admin sales invoices (B2B / bulk-order tax invoices) ─────────── */

export type AdminSalesInvoiceUnit =
  | "pcs"
  | "mtr"
  | "kg"
  | "gm"
  | "ltr"
  | "set"
  | "box"
  | "pkt"
  | "dozen"
  | "hr"
  | "day"
  | "custom";

export type AdminSalesInvoiceTaxMode = "cgst_sgst" | "igst" | "none";

export interface AdminSalesInvoiceLine {
  description: string;
  hsn?: string;
  unit: AdminSalesInvoiceUnit;
  customUnit?: string;
  qty: number;
  rate: number;
  discountPct: number;
  gstPct: number;
}

export interface AdminSalesInvoiceSeller {
  name: string;
  address: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  state?: string;
}

export interface AdminSalesInvoiceBuyer {
  name?: string;
  companyName?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  state?: string;
  phone?: string;
  email?: string;
}

export interface AdminSalesInvoiceMeta {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;
  notes?: string;
  terms?: string;
  taxMode: AdminSalesInvoiceTaxMode;
  showHsn: boolean;
  showDiscount: boolean;
  showGstColumn: boolean;
}

/** POST /admin/invoices and PUT /admin/invoices/:id payload. */
export interface AdminSalesInvoiceWriteBody {
  seller: AdminSalesInvoiceSeller;
  buyer: AdminSalesInvoiceBuyer;
  meta: AdminSalesInvoiceMeta;
  lines: AdminSalesInvoiceLine[];
}

/** Server response shape (returned by GET / POST / PUT). */
export interface AdminSalesInvoice extends AdminSalesInvoiceWriteBody {
  id: string;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxMode: AdminSalesInvoiceTaxMode;
  itemCount: number;
  grandTotal: number;
  subTotal: number;
  totalDiscount: number;
  totalGst: number;
}

export interface MarketingAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  landingPath?: string;
  capturedAt?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'razorpay' | 'cod' | 'offline_upi' | 'offline_cash';
  offlineMeta?: {
    source: 'stall' | 'personal_contact';
    fulfillment: 'delhivery' | 'offline_handover';
    createdByAdmin?: string;
  };
  marketingAttribution?: MarketingAttribution;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  /** COD handling fee when payment is cash on delivery */
  codFee?: number;
  tax: number;
  total: number;
  coupon?: string | { _id: string; code: string };
  productType?: 'standard' | 'custom';
  customRequestId?: string;
  invoice?: {
    isGenerated: boolean;
    generatedAt?: string;
  };
  statusHistory: { status: string; timestamp: string; note?: string }[];
  /** Delhivery automation metadata from backend */
  delhivery?: {
    provider?: string;
    waybills?: string[];
    masterWaybill?: string;
    shipmentCreatedAt?: string;
    lastTrackSyncAt?: string;
    lastTrackSummary?: string;
    lastPackageStatus?: string;
    estimatedTatDays?: number | null;
    package?: {
      shippingMode?: string;
      ipkg_type?: string | null;
      lengthCm?: number;
      breadthCm?: number;
      heightCm?: number;
      weightGmTotal?: number;
      boxCount?: number;
      chargeableWeightGm?: number;
    };
    trackScansSnapshot?: { status?: string; time?: string; location?: string; detail?: string }[];
    rtoDetected?: boolean;
  };
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  /** Returns / refunds — populated when customer or admin uses return flow */
  returnStatus?: string;
  returnRequest?: {
    reason?: string;
    note?: string;
    refundMethod?: string;
    requestedAt?: string;
    userBankDetails?: Record<string, string | undefined>;
  };
  refundData?: {
    amount: number;
    method: string;
    notes?: string;
    processedAt?: string;
    nonRefundableFees?: number;
    gatewayRefundId?: string;
  };
}

export type ReviewStatus = 'visible' | 'hidden' | 'flagged' | 'pending_moderation';

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
  helpfulCount?: number;
  status?: ReviewStatus;
  deletedAt?: string | null;
  reportCount?: number;
  moderationFlags?: string[];
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

export interface FilterCategoryTreeItem {
  name: string;
  slug: string;
  subcategories: Array<{ name: string; slug: string }>;
}

export interface FilterOptions {
  categories: string[];
  fabrics: string[];
  subcategories?: string[];
  occasions?: string[];
  tags?: string[];
  categoryTree?: FilterCategoryTreeItem[];
  priceRange: { minPrice: number; maxPrice: number };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  heroBannerImage?: { url: string; publicId: string };
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  subcategories: string[];
  isActive: boolean;
  isGiftCategory?: boolean;
  giftType?: "corporate" | "wedding" | "seasonal" | "festive" | "personal";
  minOrderQty?: number;
  productCount: number;
  createdAt: string;
}

export interface SubCategory {
  _id: string;
  categoryId: string | Category;
  categorySlug: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  heroBannerImage?: { url: string; publicId: string };
  metaTitle?: string;
  metaDescription?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface MegaMenuSubcategory {
  _id: string;
  name: string;
  slug: string;
  categorySlug: string;
  image?: string;
  productCount: number;
}

export interface MegaMenuCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  heroBannerImage?: { url: string; publicId: string };
  metaTitle?: string;
  subcategories: MegaMenuSubcategory[];
}

export interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    monthRevenue: number;
    revenueGrowth: number | null;
    totalPdpViews?: number;
    productsWithViews?: number;
    firstTimeBuyers?: number;
    totalSiteVisits?: number;
    siteVisitsToday?: number;
    siteVisitsMtd?: number;
    totalOrders: number;
    monthOrders: number;
    totalUsers: number;
    newUsersThisMonth: number;
    totalProducts: number;
    avgOrderValue: number;
    ordersToday: number;
    revenueToday?: number;
    pendingFulfillmentCount: number;
    paidOrdersCount: number;
    totalReviews: number;
    reviewsThisMonth: number;
    refundedAmount: number;
    refundedOrdersCount: number;
    nonRefundableFeesRetained?: number;
    // ── Entrepreneur-level metrics ──────────────────────────────────────────
    cancellationCount?: number;
    cancellationRate?: number;
    couponDiscountTotal?: number;
    couponDiscountMTD?: number;
    couponOrdersTotal?: number;
    shippingCollected?: number;
    codFeeCollected?: number;
    taxCollected?: number;
    onlineRevenue?: number;
    offlineRevenue?: number;
    onlineCount?: number;
    offlineCount?: number;
    repeatCustomers?: number;
    totalCustomersWithOrders?: number;
    repeatRate?: number;
    avgLtv?: number;
    /** Paid line-item sales vs catalog variant cost (COGS proxy) */
    productRevenue?: number;
    productCogs?: number;
    grossProfit?: number;
    grossMarginPercent?: number;
    monthProductRevenue?: number;
    monthProductCogs?: number;
    monthGrossProfit?: number;
    monthGrossMarginPercent?: number;
    profitLinesMissingCost?: number;
    profitOrderLines?: number;
  };
  refundsByReason: { _id: string; count: number }[];
  stockHealth?: {
    outOfStock: number;
    lowStock: number;
    totalActiveProducts: number;
    totalUnits: number;
  };
  outOfStockProducts?: { _id: string; name: string; totalStock: number; category: string }[];
  lowStockOnlyProducts?: { _id: string; name: string; totalStock: number; category: string }[];
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
  revenueByDay?: { date: string; revenue: number; orders: number }[];
  visitsByDay?: { date: string; visits: number }[];
  visitInsights?: {
    byCountry: { code: string; label: string; visits: number }[];
    bySource: { source: string; visits: number }[];
    byDevice: { device: string; visits: number }[];
    byLandingPage: { page: string; visits: number }[];
    byCampaign?: { campaign: string; visits: number }[];
    recent: {
      country: string;
      region: string;
      source: string;
      device: string;
      page: string;
      campaign?: string;
      medium?: string;
      at: string;
    }[];
  };
  marketingInsights?: {
    metaTracking?: {
      pixelConfigured: boolean;
      capiConfigured: boolean;
    };
    attributedOrders?: number;
    fbclidOrders?: number;
    ordersByCampaign: { campaign: string; orders: number; revenue: number }[];
    ordersBySource?: { source: string; orders: number; revenue: number }[];
  };
  paymentMethodMix?: { _id: string; revenue: number; count: number }[];
  ordersByHour?: { hour: number; orders: number; revenue: number }[];
  topVariantSizes?: { _id: string; units: number; revenue: number }[];
  topProductsByProfit?: ProductProfitRow[];
  categoryProfit?: CategoryProfitRow[];
  profitByMonth?: {
    _id: { year: number; month: number };
    productRevenue: number;
    cogs: number;
    grossProfit: number;
  }[];
  refundsByMonth?: {
    _id: { year: number; month: number };
    refunds: number;
    count: number;
  }[];
}

export interface ProductProfitRow {
  _id: string;
  name: string;
  image: string;
  category: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit: number;
  marginPercent: number;
  avgSellPrice: number;
  avgUnitCost: number;
  linesMissingCost: number;
  orderLines: number;
}

export interface CategoryProfitRow {
  _id: string;
  revenue: number;
  cogs: number;
  profit: number;
  units: number;
  marginPercent: number;
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

export type HomeGiftShopLinkMode = 'gifting' | 'product' | 'coming_soon' | 'custom';

export interface HomeGiftShowcaseCard {
  title?: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  shopButtonText?: string;
  shopButtonLink?: string;
  /** How the primary (shop) button resolves: gifting query, product path, plain link, or non-link. */
  shopLinkMode?: HomeGiftShopLinkMode;
  giftingOccasion?: string;
  giftingProductCategory?: string;
  giftingSearch?: string;
  directProductPath?: string;
  giftButtonText?: string;
  giftButtonLink?: string;
  accent?: 'rose' | 'amber' | 'sage';
}

export interface HomeGiftShowcase {
  isActive?: boolean;
  headlineLine1?: string;
  headlineLine2?: string;
  description?: string;
  socialHandle?: string;
  cards?: HomeGiftShowcaseCard[];
}

export interface HomeEditorialGalleryTile {
  image?: string;
  imagePublicId?: string;
  link?: string;
  alt?: string;
}

/** Home — editorial image grid below mid-page promo hero */
export interface HomeEditorialGallery {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
  tiles?: HomeEditorialGalleryTile[];
}

export interface HomeExploreHouse {
  saleImage?: string;
  saleImagePublicId?: string;
  saleName?: string;
  saleSubtitle?: string;
  giftingImage?: string;
  giftingImagePublicId?: string;
  giftingName?: string;
  giftingSubtitle?: string;
}

export interface StorefrontSettings {
  announcementMessages: string[];
  heroSlides: HeroSlide[];
  shopBanner?: {
    title?: string;
    subtitle?: string;
    leftImage?: string;
    leftImagePublicId?: string;
    centerImage?: string;
    centerImagePublicId?: string;
    rightImage?: string;
    rightImagePublicId?: string;
    isActive?: boolean;
  };
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
  blogBanner: {
    eyebrow?: string;
    title?: string;
    description?: string;
    mainImage?: string;
    mainImagePublicId?: string;
    sideImage?: string;
    sideImagePublicId?: string;
    buttonText?: string;
    buttonLink?: string;
    isActive?: boolean;
  };
  homeMiddleBanner?: {
    image?: string;
    imagePublicId?: string;
    title?: string;
    subtitle?: string;
    linkText?: string;
    linkUrl?: string;
    textAlignment?: "left" | "center" | "right";
    textColor?: "light" | "dark";
    isActive?: boolean;
  };
  /** Home — “Explore Our House” Sale & Gifting category cards */
  homeExploreHouse?: HomeExploreHouse;
  giftingHeroBanners?: Array<{
    title?: string;
    description?: string;
    backgroundImage?: string;
    backgroundImagePublicId?: string;
    ctaText?: string;
    ctaLink?: string;
    isActive?: boolean;
  }>;
  giftingSecondaryBanners?: Array<{
    eyebrow?: string;
    title?: string;
    image?: string;
    imagePublicId?: string;
    ctaText?: string;
    ctaLink?: string;
    isActive?: boolean;
  }>;
  /** Home — above Why Choose Us */
  homeGiftShowcase?: HomeGiftShowcase;
  /** Home — editorial gallery below promo hero */
  homeEditorialGallery?: HomeEditorialGallery;
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

export type BlogImageLayout =
  | "hero"
  | "wide"
  | "portrait"
  | "square"
  | "inline"
  | "split";

/** Where the image appears — admin controls placement. */
export type BlogImagePlacement = "cover" | "article" | "gallery";

export interface BlogImage {
  url: string;
  publicId: string;
  caption?: string;
  layout?: BlogImageLayout;
  placement?: BlogImagePlacement;
}

export interface BlogRelatedProduct {
  _id: string;
  name: string;
  slug: string;
  price?: number;
  shortDescription?: string;
  images?: { url: string; alt?: string }[];
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
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  tags?: string[];
  category?: string;
  relatedProductIds?: BlogRelatedProduct[] | string[];
  readingTimeMin?: number;
  aiGenerated?: boolean;
  aiPromptSnapshot?: string;
  scheduledPublishAt?: string | null;
  shopClickCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type BlogContentPlanStatus = "planned" | "drafted" | "published" | "skipped";

export interface BlogContentPlan {
  _id: string;
  topic: string;
  keywords: string[];
  category: string;
  plannedDate: string;
  status: BlogContentPlanStatus;
  notes?: string;
  blog?: { _id: string; title: string; slug: string; isPublished?: boolean } | string;
  createdBy?: { name: string };
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

export interface GiftingRequestItem {
  product: string | Product;
  name: string;
  quantity: number;
  customFieldAnswers: { fieldId: string; label: string; value: string }[];
}

export interface GiftingRequest {
  _id: string;
  user?: string | User;
  name: string;
  email: string;
  phone?: string;
  occasion: string;
  items: GiftingRequestItem[];
  recipientMessage?: string;
  customizationNote?: string;
  packagingPreference: 'standard' | 'premium' | 'luxury';
  referenceImages?: { url: string; publicId: string }[];
  status: 'new' | 'price_quoted' | 'approved_by_user' | 'rejected_by_user' | 'cancelled' | 'contacted' | 'confirmed' | 'rejected';
  proposedPrice?: number;
  quotedPrice?: number;
  deliveryTime?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
