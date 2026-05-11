import { z } from "zod";

/** Mongo-populated documents — shape validated at runtime only for envelope + critical keys elsewhere */
const doc = z.any();

const statusStr = z.object({ status: z.string() });

export const authWithUser = z
  .object({
    status: z.string(),
    token: z.string().optional(),
    data: z.object({ user: doc }),
  })
  .passthrough();

export const authMe = z.object({
  status: z.string(),
  data: z.object({ user: doc }),
});

export const authLogout = z.object({
  status: z.string(),
  message: z.string(),
});

export const authMessage = z.object({
  status: z.string(),
  message: z.string(),
});

export const authResetPassword = authWithUser;

export const authAddresses = z.object({
  status: z.string(),
  data: z.object({ addresses: z.array(doc) }),
});

export const categoriesList = z.object({
  status: z.string(),
  results: z.number().optional(),
  data: z.object({ categories: z.array(doc) }),
});

export const storefrontSettings = z.object({
  status: z.string(),
  data: z.object({ settings: doc }),
});

export type StorefrontSettingsApiEnvelope = z.infer<typeof storefrontSettings>;

export const productsPaginated = z
  .object({
    status: z.string(),
    results: z.number().optional(),
    pagination: z
      .object({
        currentPage: z.number(),
        totalPages: z.number(),
        totalProducts: z.number().optional(),
        total: z.number().optional(),
        hasNextPage: z.boolean().optional(),
        hasPrevPage: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    total: z.number().optional(),
    data: z.object({ products: z.array(doc) }),
  })
  .passthrough();

export const productSingle = z.object({
  status: z.string(),
  data: z.object({ product: doc }),
});

export const viewCount = z.object({
  status: z.string(),
  data: z.object({ viewCount: z.number() }),
});

export const filterOptions = z.object({
  status: z.string(),
  data: z
    .object({
      categories: z.array(z.union([z.string(), z.any()])),
      fabrics: z.array(z.union([z.string(), z.any()])),
      priceRange: z
        .object({
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

export const cartPayload = z.object({
  status: z.string(),
  data: z.object({ cart: doc }),
});

export const cartClear = z.object({
  status: z.string(),
  message: z.string(),
});

export const cartApplyCoupon = z.object({
  status: z.string(),
  data: z.object({
    cart: doc,
    coupon: z.object({
      code: z.string(),
      discountType: z.string().optional(),
      discountValue: z.number().optional(),
      appliedDiscount: z.number(),
    }),
  }),
});

/** Online prepay: order row is created only after verify-payment (legacy clients may still receive { order, razorpayOrder }). */
const mongoObjectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/);

/** Razorpay often returns `amount` as a string; coerce so the intent union branch matches reliably. */
const razorpayOrderPayload = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  currency: z.string(),
  keyId: z.string().optional(),
});

function dataHasResolvableOrderMongoId(data: { order?: unknown }): boolean {
  const order = data.order;
  if (!order || typeof order !== "object") return false;
  const o = order as Record<string, unknown>;
  const candidates = [o._id, o.id];
  for (const c of candidates) {
    if (typeof c === "string" && /^[a-fA-F0-9]{24}$/.test(c.trim())) {
      return true;
    }
    if (
      c &&
      typeof c === "object" &&
      "$oid" in c &&
      typeof (c as { $oid: string }).$oid === "string" &&
      /^[a-fA-F0-9]{24}$/.test((c as { $oid: string }).$oid)
    ) {
      return true;
    }
  }
  return false;
}

export const orderCreatedRazorpay = z
  .object({
    status: z.string(),
    data: z
      .object({
        order: doc,
        razorpayOrder: razorpayOrderPayload,
      })
      .superRefine((d, ctx) => {
        if (!dataHasResolvableOrderMongoId(d)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Legacy razorpay create response must include order._id (or id)",
            path: ["order"],
          });
        }
      }),
  })
  .passthrough();

export const orderCreatedRazorpayIntent = z
  .object({
    status: z.string(),
    data: z.object({
      checkoutIntentId: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        mongoObjectIdString,
      ),
      razorpayOrder: razorpayOrderPayload,
    }),
  })
  .passthrough();

export const orderCreatedCod = z.object({
  status: z.string(),
  data: z.object({ order: doc }),
});

export const orderPreparePayment = z
  .object({
    status: z.string(),
    data: z.object({
      order: doc,
      razorpayOrder: razorpayOrderPayload,
    }),
  })
  .passthrough();

export const orderSingle = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: z.object({ order: doc }),
});

export const ordersMyList = z.object({
  status: z.string(),
  pagination: z
    .object({
      currentPage: z.number(),
      totalPages: z.number(),
      total: z.number(),
    })
    .passthrough(),
  data: z.object({ orders: z.array(doc) }),
});

export const couponValidate = z.object({
  status: z.string(),
  data: z.object({
    coupon: doc,
    discount: z.number(),
    finalAmount: z.number(),
  }),
});

export const couponEligible = z.object({
  status: z.string(),
  data: z.object({
    coupons: z.array(doc),
    ineligible: z.array(z.object({ code: z.string(), reason: z.string() })).optional(),
    completedOrders: z.number().optional(),
  }),
});

export const couponsAdminList = z.object({
  status: z.string(),
  data: z.object({ coupons: z.array(doc) }),
});

export const reviewsFeatured = z.object({
  status: z.string(),
  results: z.number().optional(),
  data: z.object({ reviews: z.array(doc) }),
});

export const reviewsProduct = z
  .object({
    status: z.string(),
    pagination: z
      .object({
        currentPage: z.number(),
        totalPages: z.number(),
        total: z.number(),
      })
      .passthrough(),
    ratingDistribution: z.array(z.any()).optional(),
    data: z
      .object({
        reviews: z.array(doc),
        ratingDistribution: z.array(z.any()).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const reviewSingle = z.object({
  status: z.string(),
  data: z.object({ review: doc }),
});

export const canReview = z.object({
  status: z.string(),
  data: z.object({
    canReview: z.boolean(),
    hasPurchased: z.boolean().optional(),
    hasReviewed: z.boolean().optional(),
    orderId: z.any().nullable().optional(),
  }),
});

export const reviewVote = z.object({
  status: z.string(),
  data: z.object({
    helpfulCount: z.number(),
    voted: z.boolean(),
  }),
});

export const wishlistGet = z.object({
  status: z.string(),
  data: z.object({ products: z.array(doc) }),
});

export const wishlistToggle = z.object({
  status: z.string(),
  data: z.object({
    wishlistCount: z.number(),
    action: z.string(),
  }),
});

/** Admin / generic success with `data` object */
export const successData = z.object({ status: z.string(), data: z.unknown() }).passthrough();

export const successMessageData = z
  .object({ status: z.string(), message: z.string().optional(), data: z.unknown().optional() })
  .passthrough();

export const adminOrdersList = z.object({
  status: z.string(),
  pagination: z
    .object({
      currentPage: z.number(),
      totalPages: z.number(),
      total: z.number(),
    })
    .passthrough(),
  data: z.object({ orders: z.array(doc) }),
});

export const adminUsersList = z.object({
  status: z.string(),
  pagination: z
    .object({
      currentPage: z.number(),
      totalPages: z.number(),
      total: z.number(),
    })
    .passthrough(),
  data: z.object({ users: z.array(doc) }),
});

export const adminOfflineCustomersList = z.object({
  status: z.string(),
  pagination: z
    .object({
      currentPage: z.number(),
      totalPages: z.number(),
      total: z.number(),
    })
    .passthrough(),
  data: z.object({
    offlineCustomers: z.array(
      z
        .object({
          email: z.string(),
          phone: z.string(),
          name: z.string(),
          lastOfflineOrderAt: z.string().optional(),
          offlineOrderCount: z.number().optional(),
          createdAt: z.string().optional(),
          updatedAt: z.string().optional(),
        })
        .passthrough(),
    ),
  }),
});

export const adminUserDirectoryStats = z.object({
  status: z.string(),
  data: z.object({
    users: z.object({
      total: z.number(),
      active: z.number(),
      inactive: z.number(),
    }),
    admins: z.object({
      total: z.number(),
      active: z.number(),
      inactive: z.number(),
    }),
  }),
});

export const adminReturnsInsights = z.object({
  status: z.string(),
  data: z.any(),
});

export const adminToggleUser = z.object({
  status: z.string(),
  data: z.object({ isActive: z.boolean() }),
});

export const adminUpdateUserRole = z.object({
  status: z.string(),
  data: z.object({
    user: z.object({
      _id: z.string(),
      role: z.enum(['user', 'admin']),
    }),
  }),
});

export const adminUserInsights = z.object({
  status: z.string(),
  data: z.object({
    user: doc,
    metrics: doc,
    orders: z.array(doc),
  }),
});

export const adminUpdateUserNote = z.object({
  status: z.string(),
  data: z.object({
    user: z.object({
      _id: z.string(),
      adminNote: z.string().optional(),
    }),
  }),
});

export const adminAuditLogsList = z.object({
  status: z.string(),
  pagination: z
    .object({
      currentPage: z.number(),
      totalPages: z.number(),
      total: z.number(),
    })
    .passthrough(),
  data: z.object({ logs: z.array(doc) }),
});

export const adminReviewsList = z.object({
  status: z.string(),
  pagination: z
    .object({
      currentPage: z.number(),
      totalPages: z.number(),
      total: z.number(),
    })
    .passthrough(),
  data: z.object({ reviews: z.array(doc) }),
});

export const adminCategoriesList = z.object({
  status: z.string(),
  data: z.object({ categories: z.array(doc) }),
});

export const adminAnalytics = z.object({
  status: z.string(),
  data: z.any(),
});

export const adminOrderDetail = z.object({
  status: z.string(),
  data: z.object({ order: doc }),
});

export { adminSalesInvoiceList, adminSalesInvoiceSingle } from "./invoiceApiSchemas";

/** POST .../delhivery/sync-tracking — includes human summary + parsed tracking */
export const adminDelhiveryTrackSync = z.object({
  status: z.string(),
  data: z
    .object({
      order: doc,
      summary: z.string().optional(),
      tracking: z
        .object({
          lastStatus: z.string().optional(),
          scanCount: z.number().optional(),
          lastScan: z.record(z.unknown()).optional(),
          waybill: z.string().optional(),
          usedRefFallback: z.boolean().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

export const delhiveryStatus = z.object({
  status: z.string(),
  data: z
    .object({
      configured: z.boolean(),
      baseUrl: z.string().optional(),
      pickupLocationName: z.string().nullable().optional(),
      originPincode: z.string().nullable().optional(),
    })
    .passthrough(),
});

export const delhiveryPinCheck = z.object({
  status: z.string(),
  data: z
    .object({
      pin: z.string().optional(),
      serviceable: z.boolean().optional(),
      remark: z.string().optional(),
    })
    .passthrough(),
});

/** Same payload as pin-check on order — used for GET /admin/delhivery/serviceability?pin= */
export const delhiveryServiceability = delhiveryPinCheck;

export const delhiveryEstimate = z.object({
  status: z.string(),
  data: z
    .object({
      boxCount: z.number().optional(),
      perBoxDeadWeightGm: z.number().optional(),
      chargeableWeightGm: z.number().optional(),
      cgmRequested: z.number().optional(),
      chargedWeightDelhivery: z.number().optional(),
      charges: z.unknown().optional(),
      tatDays: z.number().optional(),
      tatRaw: z.unknown().optional(),
    })
    .passthrough(),
});

/** GET .../delhivery/packing-slip — Delhivery S3 PDF link */
export const delhiveryPackingSlip = z.object({
  status: z.string(),
  data: z
    .object({
      pdfUrl: z.string().min(1),
      waybill: z.string(),
      pdfSize: z.enum(['4R', 'A4']),
    })
    .passthrough(),
});

/** GET .../delhivery/packing-slip/json — Delhivery pdf=false payload (custom label data). */
export const delhiveryPackingSlipJson = z.object({
  status: z.string(),
  data: z
    .object({
      waybill: z.string(),
      pdfSize: z.enum(['4R', 'A4']),
      payload: z.unknown(),
    })
    .passthrough(),
});

export const adminStorefront = z.object({
  status: z.string(),
  data: z.object({ settings: doc }),
});

export const emptySuccess = statusStr;

export const nullDataSuccess = z.object({ status: z.string(), data: z.null().optional() });

export const categorySingle = z.object({
  status: z.string(),
  data: z.object({ category: doc }),
});

export const categoryStats = z.object({ status: z.string(), data: z.unknown() });

export const orderCreateResponse = z.union([
  orderCreatedRazorpayIntent,
  orderCreatedRazorpay,
  orderCreatedCod,
]);

// ------------------------------------------------------------------
// NEW SCHEMAS FOR BLOG, NOTIFICATION, GIFTING
// ------------------------------------------------------------------

export const blogsPaginated = z
  .object({
    status: z.string(),
    pagination: z
      .object({
        currentPage: z.number(),
        totalPages: z.number(),
        total: z.number().optional(),
        hasNextPage: z.boolean().optional(),
        hasPrevPage: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    data: z.object({ blogs: z.array(doc) }).passthrough().optional(),
  })
  .passthrough();

export const blogSingle = z.object({
  status: z.string(),
  data: z.object({ blog: doc, comments: z.array(doc).optional() }).passthrough().optional(),
}).passthrough();

export const notificationsList = z.object({
  status: z.string(),
  data: z.object({ notifications: z.array(doc), unreadCount: z.number().optional() }).passthrough().optional(),
}).passthrough();

export const notificationSingle = z.object({
  status: z.string(),
  data: z.object({ notification: doc }).passthrough().optional(),
}).passthrough();

export const pushPublicKey = z.object({
  status: z.string(),
  data: z.object({ publicKey: z.string(), enabled: z.boolean().optional() }).passthrough().optional(),
}).passthrough();

export const giftingProductsList = z.object({
  status: z.string(),
  pagination: z.any().optional(),
  data: z.object({ products: z.array(doc) }).passthrough().optional(),
}).passthrough();

export const giftingRequestsList = z.object({
  status: z.string(),
  pagination: z.any().optional(),
  data: z.object({ requests: z.array(doc) }).passthrough().optional(),
}).passthrough();

export const giftingRequestSingle = z.object({
  status: z.string(),
  data: z.object({ request: doc }).passthrough().optional(),
}).passthrough();
