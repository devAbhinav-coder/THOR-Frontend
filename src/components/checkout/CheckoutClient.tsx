"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Home,
  ArrowRight,
  Loader2,
  MapPin,
  Minus,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Shield,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import {
  useCartStore,
  getCartAppliedCouponCodeForOrder,
  readPersistedCartCouponCode,
} from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { authApi, couponApi, orderApi } from "@/lib/api";
import { formatPrice, cn, loadRazorpayScript } from "@/lib/utils";
import { cartLineReactKey } from "@/lib/cartLineKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coupon, Order } from "@/types";
import type { CheckoutDisplayItem } from "@/types/checkoutDisplay";
import {
  getRazorpayConstructor,
  type RazorpaySuccessPayload,
} from "@/lib/razorpayTypes";
import { toCheckoutRowDisplay } from "@/lib/checkoutDisplayHelpers";
import type { CartItem } from "@/types";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import OrderPlacementSuccessOverlay from "@/components/checkout/OrderPlacementSuccessOverlay";
import { trackPurchase, trackInitiateCheckout } from "@/lib/metaPixel";
import { trackGaPurchase, trackGaBeginCheckout } from "@/lib/googleAnalytics";

function normalizeIndianMobileDigits(val: string): string {
  let d = val.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

const addressSchema = z.object({
  name: z.string().min(2, "Full name is required").max(80, "Name is too long"),
  phone: z
    .string()
    .min(1, "Mobile number is required")
    .refine(
      (val) => normalizeIndianMobileDigits(val).length === 10,
      "Enter exactly 10 digits",
    )
    .refine((val) => {
      const raw = normalizeIndianMobileDigits(val);
      const pn = parsePhoneNumberFromString(raw, "IN");
      return !!pn && pn.isValid() && pn.country === "IN";
    }, "Enter a valid Indian mobile number"),
  /** House / flat / building (optional, separate from street). */
  house: z.string().max(120, "House / flat / building is too long").optional(),
  street: z.string().min(5, "Street / area is required"),
  /** Nearby landmark (optional). */
  landmark: z.string().max(160, "Landmark is too long").optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(1, "Please select state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode"),
  country: z.string().default("India"),
});

type AddressForm = z.infer<typeof addressSchema>;

const SHIPPING_THRESHOLD = 1099;
const SHIPPING_CHARGE = 99;
/** Must match backend `COD_HANDLING_FEE` — added when paying cash on delivery */
const COD_HANDLING_FEE = 99;
const TAX_RATE = 0;
const BUY_NOW_SESSION_KEY = "hor_buy_now_checkout_item";

type BuyNowCheckoutItem = {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  variant: { size?: string; color?: string; colorCode?: string; sku: string };
  customFieldAnswers?: { label: string; value: string }[];
  /** Variant stock when saved from PDP; caps qty in checkout. */
  maxStock?: number;
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
];

export default function CheckoutClient() {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  /** Default open so mobile users always see qty/delete without an extra tap. */
  const [showItems, setShowItems] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [eligibleCoupons, setEligibleCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isAllCouponsOpen, setIsAllCouponsOpen] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowCheckoutItem | null>(null);
  const [buyNowCouponCode, setBuyNowCouponCode] = useState<string | null>(null);
  const [buyNowCouponDiscount, setBuyNowCouponDiscount] = useState(0);
  const [pendingOrderSuccessId, setPendingOrderSuccessId] = useState<
    string | null
  >(null);
  const [lineBusySku, setLineBusySku] = useState<string | null>(null);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const shippingFieldsRef = useRef<HTMLDivElement>(null);
  const didInitDefaultSavedAddress = useRef(false);
  /** Mobile & tablet: step 1 address → 2 payment → 3 review & pay */
  const [mobileCheckoutStep, setMobileCheckoutStep] = useState(1);
  const [isCheckoutNarrow, setIsCheckoutNarrow] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<
    "cod" | "razorpay"
  >("cod");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Close any pre-checkout launch modal once checkout page is mounted.
    const launchFxNodes = document.querySelectorAll(
      "[data-checkout-launch-fx='1']",
    );
    launchFxNodes.forEach((node) => {
      const timerRaw = (node as HTMLElement).getAttribute("data-stale-timer");
      if (timerRaw) {
        const timerId = Number(timerRaw);
        if (Number.isFinite(timerId)) window.clearTimeout(timerId);
      }
      node.remove();
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsCheckoutNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Custom Order support
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const isExplicitBuyNowFlow = searchParams.get("buyNow") === "1";
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [isOrderLoading, setIsOrderLoading] = useState(!!orderId);

  const {
    cart,
    fetchCart,
    applyCoupon,
    removeCoupon,
    resetCart,
    appliedCouponCode,
    updateItem,
    removeItem,
  } = useCartStore();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    trigger,
    getValues,
    watch,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "India" },
    shouldUnregister: false,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const watchedStreet = watch("street");
  const showManualAddressPreview =
    !showShippingForm &&
    !selectedAddressId &&
    Boolean((watchedStreet || "").trim());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isExplicitBuyNowFlow) {
      setBuyNowItem(null);
      setBuyNowCouponCode(null);
      setBuyNowCouponDiscount(0);
      sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
      return;
    }
    try {
      const raw = sessionStorage.getItem(BUY_NOW_SESSION_KEY);
      if (!raw) {
        setBuyNowItem(null);
        return;
      }
      const parsed = JSON.parse(raw) as BuyNowCheckoutItem;
      if (!parsed?.productId || !parsed?.variant?.sku || !parsed?.quantity) {
        sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
        setBuyNowItem(null);
        return;
      }
      setBuyNowItem(parsed);
    } catch {
      sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
      setBuyNowItem(null);
    }
  }, [isExplicitBuyNowFlow]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const res = await orderApi.getById(orderId);
          setExistingOrder(res.data.order);
          // Pre-fill address if available
          const addr = res.data.order.shippingAddress;
          if (addr && addr.name) {
            setValue("name", addr.name);
            setValue("phone", addr.phone);
            setValue("street", addr.street);
            setValue("city", addr.city);
            setValue("state", addr.state);
            setValue("pincode", addr.pincode);
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : "Failed to load order";
          toast.error(msg);
          router.replace("/dashboard/gifting");
        } finally {
          setIsOrderLoading(false);
        }
      };
      fetchOrder();
    } else if (!buyNowItem) {
      fetchCart().catch(() => {});
    }
  }, [isAuthenticated, fetchCart, orderId, router, setValue, buyNowItem]);

  /** If cart still has a discount but Zustand lost the code (race / sync bug), restore from sessionStorage. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated || buyNowItem || existingOrder) return;
    const { cart: stCart, appliedCouponCode: stCode } = useCartStore.getState();
    if (!stCart?.items?.length || (stCart.discount ?? 0) <= 0) return;
    if (stCode) return;
    const stored = readPersistedCartCouponCode();
    if (stored) useCartStore.setState({ appliedCouponCode: stored });
  }, [
    isAuthenticated,
    cart?.discount,
    cart?.items?.length,
    appliedCouponCode,
    buyNowItem,
    existingOrder,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const amountForEligibility =
      buyNowItem ? buyNowItem.price * buyNowItem.quantity : cart?.subtotal || 0;
    if (amountForEligibility <= 0) return;
    const fetchEligibleCoupons = async () => {
      setIsLoadingCoupons(true);
      try {
        const res = await couponApi.getEligible(amountForEligibility);
        setEligibleCoupons(res.data.coupons || []);
      } catch {
        setEligibleCoupons([]);
      } finally {
        setIsLoadingCoupons(false);
      }
    };
    fetchEligibleCoupons();
  }, [cart?.subtotal, cart?.items?.length, isAuthenticated, buyNowItem]);

  const paymentMethodForApi =
    existingOrder ? "razorpay" : checkoutPaymentMethod;

  const {
    subtotal,
    discount,
    subtotalAfterDiscount,
    shippingCharge,
    codFee,
    tax,
    total,
    hasAppliedCoupon,
    activeCouponCode,
    activeCouponDiscount,
  } = useMemo(() => {
    const subtotal =
      existingOrder ? existingOrder.subtotal
      : buyNowItem ? buyNowItem.price * buyNowItem.quantity
      : cart?.subtotal || 0;
    const discount =
      existingOrder ? existingOrder.discount
      : buyNowItem ? buyNowCouponDiscount
      : cart?.discount || 0;
    const subtotalAfterDiscount = subtotal - discount;
    const shippingCharge =
      existingOrder ? existingOrder.shippingCharge
      : subtotalAfterDiscount >= SHIPPING_THRESHOLD ? 0
      : SHIPPING_CHARGE;
    const tax =
      existingOrder ?
        existingOrder.tax
      : Math.round(subtotalAfterDiscount * TAX_RATE * 100) / 100;
    const codFee =
      existingOrder ? (existingOrder.codFee ?? 0)
      : checkoutPaymentMethod === "cod" ? COD_HANDLING_FEE
      : 0;
    const total =
      existingOrder ?
        existingOrder.total
      : subtotalAfterDiscount + shippingCharge + tax + codFee;
    const hasAppliedCoupon =
      existingOrder ? !!existingOrder.coupon
      : buyNowItem ? !!buyNowCouponCode
      : (cart?.discount ?? 0) > 0 || Boolean(appliedCouponCode);
    const activeCouponCode = buyNowItem ? buyNowCouponCode : appliedCouponCode;
    const activeCouponDiscount =
      buyNowItem ? buyNowCouponDiscount : cart?.discount || 0;
    return {
      subtotal,
      discount,
      subtotalAfterDiscount,
      shippingCharge,
      codFee,
      tax,
      total,
      hasAppliedCoupon,
      activeCouponCode,
      activeCouponDiscount,
    };
  }, [
    existingOrder,
    buyNowItem,
    cart?.subtotal,
    cart?.discount,
    buyNowCouponCode,
    buyNowCouponDiscount,
    appliedCouponCode,
    checkoutPaymentMethod,
  ]);

  /* Meta Pixel & GA4: Track InitiateCheckout / begin_checkout */
  const hasTrackedCheckout = useRef(false);
  useEffect(() => {
    if (hasTrackedCheckout.current || total <= 0) return;
    const numItems = existingOrder ? existingOrder.items?.length || 1 : buyNowItem ? 1 : cart?.items?.length || 1;
    const trackingItems = existingOrder ? existingOrder.items : buyNowItem ? [buyNowItem] : cart?.items || [];
    
    trackInitiateCheckout(total, numItems);
    if (trackingItems.length > 0) {
      trackGaBeginCheckout(total, trackingItems);
    }
    
    hasTrackedCheckout.current = true;
  }, [total, existingOrder, buyNowItem, cart?.items]);

  const showMobileCheckoutWizard = isCheckoutNarrow && !existingOrder;

  const applySelectedCoupon = useCallback(
    async (code: string) => {
      if (buyNowItem) {
        const orderAmount = buyNowItem.price * buyNowItem.quantity;
        const res = await couponApi.validate(code, orderAmount);
        setBuyNowCouponCode(res.data.coupon.code);
        setBuyNowCouponDiscount(res.data.discount || 0);
        toast.success(
          `Coupon applied. You saved ${formatPrice(res.data.discount || 0)}.`,
        );
        return;
      }
      await applyCoupon(code);
    },
    [buyNowItem, applyCoupon],
  );

  const removeSelectedCoupon = useCallback(async () => {
    if (buyNowItem) {
      setBuyNowCouponCode(null);
      setBuyNowCouponDiscount(0);
      toast.success("Coupon removed.");
      return;
    }
    await removeCoupon();
  }, [buyNowItem, removeCoupon]);

  const loadAddress = useCallback(
    (addressId: string) => {
      const addr = user?.addresses.find((a) => a._id === addressId);
      if (addr) {
        setValue("name", addr.name || user?.name || "");
        setValue("phone", addr.phone || user?.phone || "");
        setValue("house", addr.house || "");
        setValue("street", addr.street);
        setValue("landmark", addr.landmark || "");
        setValue("city", addr.city);
        setValue("state", addr.state);
        setValue("pincode", addr.pincode);
        setSelectedAddressId(addressId);
      }
    },
    [user, setValue],
  );

  useEffect(() => {
    if (!user || orderId) return;
    const addrs = user.addresses;
    if (addrs && addrs.length > 0) {
      setShowShippingForm(false);
      if (!didInitDefaultSavedAddress.current) {
        didInitDefaultSavedAddress.current = true;
        const id = addrs[0]._id;
        if (id) loadAddress(id);
      }
    } else {
      didInitDefaultSavedAddress.current = false;
      setShowShippingForm(true);
    }
  }, [user, orderId, loadAddress]);

  useEffect(() => {
    if (existingOrder?.shippingAddress?.name) {
      setShowShippingForm(false);
    }
  }, [existingOrder]);

  /** Opens shipping fields if needed so focus + inline errors work (saved-address collapsed UI). */
  const validateAddressFields = useCallback(async (): Promise<boolean> => {
    let ok = await trigger(undefined, { shouldFocus: true });
    if (!ok) {
      setShowShippingForm(true);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      ok = await trigger(undefined, { shouldFocus: true });
      if (!ok) {
        toast.error(
          "Please fix the highlighted fields in your delivery address.",
        );
        requestAnimationFrame(() =>
          shippingFieldsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        );
      }
    }
    return ok;
  }, [trigger]);

  const confirmShippingForm = useCallback(async () => {
    const ok = await trigger(undefined, { shouldFocus: true });
    if (!ok) {
      toast.error("Please fix the highlighted fields.");
      requestAnimationFrame(() =>
        shippingFieldsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      );
      return;
    }

    const raw = getValues();
    const payload = {
      name: raw.name.trim(),
      phone: raw.phone.replace(/\s+/g, ""),
      house: raw.house?.trim() || undefined,
      street: raw.street.trim(),
      landmark: raw.landmark?.trim() || undefined,
      city: raw.city.trim(),
      state: raw.state.trim(),
      pincode: raw.pincode.trim(),
      country: raw.country?.trim() || "India",
    };

    if (!isAuthenticated || !user) {
      setShowShippingForm(false);
      return;
    }

    try {
      const selected =
        selectedAddressId ?
          user.addresses.find((a) => a._id === selectedAddressId)
        : undefined;
      if (selected?._id) {
        await authApi.removeAddress(selected._id);
      }

      const saved = await authApi.addAddress({
        ...payload,
        label: selected?.label || "Home",
        isDefault: selected?.isDefault || user.addresses.length === 0,
      });

      const addresses = saved.data.addresses || [];
      const match = addresses.find(
        (a) =>
          a.name === payload.name &&
          a.phone.replace(/\s+/g, "") === payload.phone &&
          (a.house || "") === (payload.house || "") &&
          a.street === payload.street &&
          (a.landmark || "") === (payload.landmark || "") &&
          a.city === payload.city &&
          a.state === payload.state &&
          a.pincode === payload.pincode,
      );
      if (match?._id) setSelectedAddressId(match._id);
      setUser({ ...user, addresses });
      toast.success("Address saved to your profile.");
      setShowShippingForm(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ?
          err.message
        : "Could not save address. Please try again.";
      toast.error(msg);
    }
  }, [getValues, isAuthenticated, selectedAddressId, setUser, trigger, user]);

  const goToMobilePaymentStep = useCallback(async () => {
    const ok = await validateAddressFields();
    if (!ok) return;
    setMobileCheckoutStep(2);
  }, [validateAddressFields]);

  const goToMobileReviewStep = useCallback(() => {
    setMobileCheckoutStep(3);
  }, []);

  const goToMobileStep = useCallback(
    async (targetStep: 1 | 2 | 3) => {
      if (targetStep === 1) {
        setMobileCheckoutStep(1);
        return;
      }
      if (targetStep === 2) {
        await goToMobilePaymentStep();
        return;
      }
      const ok = await validateAddressFields();
      if (!ok) return;
      setMobileCheckoutStep(3);
    },
    [goToMobilePaymentStep, validateAddressFields],
  );

  const openNewAddressForm = useCallback(() => {
    setSelectedAddressId("");
    reset({
      name: user?.name || "",
      phone: (user?.phone || "").replace(/\s/g, ""),
      house: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    });
    setShowShippingForm(true);
    requestAnimationFrame(() =>
      shippingFieldsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }, [reset, user?.name, user?.phone]);

  const removeSavedAddress = useCallback(
    async (addressId: string) => {
      if (!user) return;
      try {
        const res = await authApi.removeAddress(addressId);
        const addresses = res.data.addresses || [];
        setUser({ ...user, addresses });

        if (selectedAddressId === addressId) {
          const fallbackId = addresses[0]?._id;
          if (fallbackId) {
            loadAddress(fallbackId);
            setShowShippingForm(false);
          } else {
            openNewAddressForm();
          }
        }
        toast.success("Address removed.");
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Could not remove address.";
        toast.error(msg);
      }
    },
    [loadAddress, openNewAddressForm, selectedAddressId, setUser, user],
  );

  const offerText = useMemo(() => {
    if (existingOrder) return "";
    if (!buyNowItem && !cart) return "";
    if (subtotalAfterDiscount >= SHIPPING_THRESHOLD)
      return "You unlocked FREE shipping!";
    return `Add ${formatPrice(SHIPPING_THRESHOLD - subtotalAfterDiscount)} more for FREE shipping`;
  }, [cart, subtotalAfterDiscount, buyNowItem, existingOrder]);

  const onSubmit = useCallback(
    async (addressData: AddressForm) => {
      setIsPlacingOrder(true);
      let holdPlacingUntilOverlay = false;
      try {
        const normalizedPhone =
          parsePhoneNumberFromString(
            addressData.phone.replace(/\s+/g, ""),
            "IN",
          )?.number || addressData.phone;

        if (existingOrder) {
          const prepRes = await orderApi.preparePayment(existingOrder._id);
          const { razorpayOrder } = prepRes.data;

          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

          const options = {
            key: razorpayOrder.keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "The House of Rani",
            description: `Order ${existingOrder.orderNumber}`,
            order_id: razorpayOrder.id,
            handler: async (response: RazorpaySuccessPayload) => {
              try {
                const verifyRes = await orderApi.verifyPayment({
                  orderId: existingOrder._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                setPendingOrderSuccessId(verifyRes.data.order._id);
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ?
                    err.message
                  : "Payment verification failed";
                toast.error(msg);
              }
            },
            prefill: {
              name: addressData.name,
              email: user?.email,
              contact: normalizedPhone,
            },
            theme: { color: "#e8604c" },
          };

          const RazorpayCtor = getRazorpayConstructor();
          if (!RazorpayCtor) throw new Error("Razorpay SDK not available");
          const rzp = new RazorpayCtor(options);
          rzp.open();
        } else {
          const idempotencyKey =
            typeof crypto !== "undefined" && crypto.randomUUID ?
              crypto.randomUUID()
            : `k${Date.now()}_${Math.floor(Math.random() * 1e12)}`;

          const couponCodeForOrder =
            buyNowItem ?
              buyNowCouponCode || undefined
            : getCartAppliedCouponCodeForOrder() || undefined;

          const res = await orderApi.create(
            {
              shippingAddress: { ...addressData, phone: normalizedPhone },
              paymentMethod: paymentMethodForApi,
              ...(couponCodeForOrder ? { couponCode: couponCodeForOrder } : {}),
              ...(buyNowItem ?
                {
                  buyNowItem: {
                    productId: buyNowItem.productId,
                    variant: buyNowItem.variant,
                    quantity: buyNowItem.quantity,
                    customFieldAnswers: buyNowItem.customFieldAnswers,
                  },
                }
              : {}),
            },
            { idempotencyKey },
          );

          if ("razorpayOrder" in res.data) {
            const { razorpayOrder } = res.data;
            const checkoutIntentId =
              "checkoutIntentId" in res.data &&
              typeof (res.data as { checkoutIntentId?: unknown })
                .checkoutIntentId === "string" ?
                (res.data as { checkoutIntentId: string }).checkoutIntentId
              : null;
            const legacyOrder =
              "order" in res.data &&
              (res.data as { order?: { _id?: string; orderNumber?: string } })
                .order ?
                (res.data as { order: { _id: string; orderNumber?: string } })
                  .order
              : null;
            const legacyOrderId = legacyOrder?._id ?? "";
            if (!checkoutIntentId && !legacyOrderId) {
              toast.error("Invalid payment session. Please try again.");
              await fetchCart().catch(() => {});
              return;
            }
            const keyId = razorpayOrder.keyId;
            if (!keyId) {
              toast.error(
                "Payment gateway is not configured. Try COD or contact support.",
              );
              await fetchCart().catch(() => {});
              return;
            }

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
              toast.error("Payment SDK failed to load. Refresh and try again.");
              await fetchCart().catch(() => {});
              return;
            }

            const openRazorpay = () => {
              const options = {
                key: keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency || "INR",
                order_id: razorpayOrder.id,
                name: "The House of Rani",
                description:
                  legacyOrder?.orderNumber ?
                    `Order ${legacyOrder.orderNumber}`
                  : "Secure checkout",
                handler: async (response: RazorpaySuccessPayload) => {
                  setIsPlacingOrder(true);
                  try {
                    const verifyRes = await orderApi.verifyPayment({
                      ...(checkoutIntentId ?
                        { checkoutIntentId }
                      : { orderId: legacyOrderId }),
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                    });
                    
                    trackPurchase(verifyRes.data.order);
                    trackGaPurchase(verifyRes.data.order);

                    if (buyNowItem) {
                      if (typeof window !== "undefined") {
                        sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
                      }
                      setBuyNowItem(null);
                    } else {
                      resetCart();
                    }
                    holdPlacingUntilOverlay = true;
                    setPendingOrderSuccessId(verifyRes.data.order._id);
                  } catch (err: unknown) {
                    const msg =
                      err instanceof Error ?
                        err.message
                      : "Payment verification failed";
                    toast.error(msg);
                    await fetchCart().catch(() => {});
                  } finally {
                    setIsPlacingOrder(false);
                  }
                },
                modal: {
                  ondismiss: () => {
                    toast(
                      checkoutIntentId ?
                        "Payment was not completed. Your cart is unchanged — you can try again when ready."
                      : "Payment window closed. You can complete payment from your order details.",
                      { duration: 5000 },
                    );
                  },
                },
                prefill: {
                  name: addressData.name,
                  email: user?.email,
                  contact: normalizedPhone,
                },
                theme: { color: "#e8604c" },
              };

              const RazorpayCtor = getRazorpayConstructor();
              if (!RazorpayCtor) {
                toast.error("Razorpay is not available in this browser.");
                return;
              }
              const rzp = new RazorpayCtor(options);
              rzp.open();
            };

            openRazorpay();
          } else {
            const { order } = res.data;
            
            trackPurchase(order);
            trackGaPurchase(order);

            if (buyNowItem) {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
              }
              setBuyNowItem(null);
            } else {
              resetCart();
            }
            holdPlacingUntilOverlay = true;
            setPendingOrderSuccessId(order._id);
          }
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || "Failed to process order");
      } finally {
        if (!holdPlacingUntilOverlay) setIsPlacingOrder(false);
      }
    },
    [
      existingOrder,
      buyNowItem,
      user?.email,
      resetCart,
      fetchCart,
      buyNowCouponCode,
      paymentMethodForApi,
    ],
  );

  const bumpLineQty = useCallback(
    async (sku: string, delta: number, current: number, maxQty: number) => {
      const next = current + delta;
      if (next < 1) {
        setLineBusySku(sku);
        try {
          await removeItem(sku);
        } finally {
          setLineBusySku(null);
        }
        return;
      }
      const capped = Math.min(next, maxQty, 10);
      if (capped === current) {
        if (delta > 0 && current >= maxQty) {
          toast.error(
            maxQty >= 10 ?
              "You can add at most 10 of this item."
            : "No more stock available for this item.",
          );
        }
        return;
      }
      setLineBusySku(sku);
      try {
        await updateItem(sku, capped);
      } finally {
        setLineBusySku(null);
      }
    },
    [updateItem, removeItem],
  );

  const removeLine = useCallback(
    async (sku: string) => {
      setLineBusySku(sku);
      try {
        await removeItem(sku);
      } finally {
        setLineBusySku(null);
      }
    },
    [removeItem],
  );

  const bumpBuyNowQty = useCallback(
    async (delta: number, current: number, maxQty: number) => {
      if (!buyNowItem) return;
      const sku = buyNowItem.variant.sku;
      const next = current + delta;
      if (next < 1) {
        setLineBusySku(sku);
        try {
          sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
          setBuyNowItem(null);
          toast.success("Item removed from checkout");
        } finally {
          setLineBusySku(null);
        }
        return;
      }
      const capped = Math.min(next, maxQty, 10);
      if (capped === current) {
        if (delta > 0 && current >= maxQty) {
          toast.error(
            maxQty >= 10 ?
              "You can add at most 10 of this item."
            : "No more stock available for this item.",
          );
        }
        return;
      }
      setLineBusySku(sku);
      try {
        const updated = { ...buyNowItem, quantity: capped };
        setBuyNowItem(updated);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(BUY_NOW_SESSION_KEY, JSON.stringify(updated));
        }
      } finally {
        setLineBusySku(null);
      }
    },
    [buyNowItem],
  );

  const removeBuyNowLine = useCallback(() => {
    if (!buyNowItem) return;
    const sku = buyNowItem.variant.sku;
    setLineBusySku(sku);
    try {
      sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
      setBuyNowItem(null);
      toast.success("Item removed from checkout");
    } finally {
      setLineBusySku(null);
    }
  }, [buyNowItem]);

  if (!isAuthenticated || isOrderLoading)
    return (
      <div className='max-w-7xl mx-auto px-4 py-24 text-center'>
        <Loader2 className='h-10 w-10 text-brand-500 animate-spin mx-auto mb-4' />
        <p className='text-gray-500'>Preparing checkout...</p>
      </div>
    );

  if (
    !existingOrder &&
    !buyNowItem &&
    (!cart || cart.items.length === 0) &&
    !pendingOrderSuccessId
  ) {
    return (
      <div className='relative min-h-[min(85vh,780px)] w-full overflow-hidden bg-[#faf9f7]'>
        <div
          className='pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-[#b02a37]/[0.09] blur-3xl animate-pulse'
          aria-hidden
        />
        <div
          className='pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-gold-300/25 blur-3xl animate-pulse [animation-delay:1.2s]'
          aria-hidden
        />

        <div className='relative mx-auto flex min-h-[min(85vh,780px)] max-w-lg flex-col items-center justify-center px-4 py-14 sm:py-20'>
          <div
            className={cn(
              "w-full max-w-md rounded-[1.75rem] border border-gray-200/80 bg-white p-8 text-center shadow-[0_20px_50px_-20px_rgba(15,23,42,0.12)] sm:p-10",
              "transition-transform duration-300 ease-out hover:scale-[1.02]",
              "animate-in fade-in slide-in-from-bottom-4 duration-500",
            )}
          >
            <div className='mx-auto mb-7 flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-2xl bg-gradient-to-b from-rose-50/95 to-white ring-1 ring-rose-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'>
              <ShoppingBag
                className='h-11 w-11 text-[#b02a37] animate-checkout-empty-wiggle'
                strokeWidth={1.25}
                aria-hidden
              />
            </div>

            <h2 className='font-serif text-2xl font-bold tracking-tight text-navy-900 sm:text-[1.65rem]'>
              Your cart is empty
            </h2>
            <p className='mx-auto mt-3 max-w-sm text-sm font-normal leading-relaxed text-gray-500'>
              Discover pieces you love — add them to your bag and they&apos;ll
              show up here when you&apos;re ready to checkout.
            </p>

            <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-3'>
              <Button
                asChild
                variant='brand'
                size='xl'
                className='group h-12 min-w-0 flex-1 rounded-2xl px-6 text-sm font-bold shadow-md shadow-red-900/10 transition-all duration-200 hover:bg-brand-700 sm:h-12 sm:min-w-[11rem] sm:flex-initial'
              >
                <Link
                  href='/shop'
                  className='inline-flex items-center justify-center gap-2'
                >
                  Continue shopping
                  <ArrowRight className='h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Link>
              </Button>
              <Button
                asChild
                variant='brand-outline'
                size='xl'
                className='group h-12 min-w-0 flex-1 rounded-2xl px-6 text-sm font-semibold transition-colors duration-200 hover:bg-rose-50/80 sm:h-12 sm:min-w-[11rem] sm:flex-initial'
              >
                <Link
                  href='/'
                  className='inline-flex items-center justify-center gap-2'
                >
                  <Home className='h-4 w-4 shrink-0 text-brand-600' />
                  Back to home
                </Link>
              </Button>
            </div>
          </div>

          <p className='mt-8 text-center text-xs font-medium text-emerald-700/90 animate-in fade-in duration-500 [animation-delay:150ms] [animation-fill-mode:both]'>
            <span className='inline-flex items-center justify-center gap-1.5'>
              <Shield className='h-3.5 w-3.5 shrink-0 stroke-[1.75]' />
              Secure checkout when you&apos;re ready
            </span>
          </p>
        </div>
      </div>
    );
  }

  const checkoutItems: CheckoutDisplayItem[] =
    existingOrder ? existingOrder.items
    : buyNowItem ?
      [
        {
          product: {
            _id: buyNowItem.productId,
            images: [{ url: buyNowItem.image, publicId: "", alt: "" }],
          },
          name: buyNowItem.name,
          variant: buyNowItem.variant,
          quantity: buyNowItem.quantity,
          price: buyNowItem.price,
          customFieldAnswers: buyNowItem.customFieldAnswers,
        },
      ]
    : cart?.items || [];

  const checkoutAccent = "text-[#b02a37]";
  const checkoutRing = "ring-[#b02a37]";
  const scrollToShippingFields = () => {
    shippingFieldsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className='w-full min-w-0 overflow-x-hidden bg-[#faf9f7]'>
      <OrderPlacementSuccessOverlay
        isOpen={isPlacingOrder || Boolean(pendingOrderSuccessId)}
        orderId={pendingOrderSuccessId}
      />
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-8 box-border min-w-0 animate-in fade-in duration-500'>
        <header className='mb-2 lg:mb-10'>
          <h1 className='text-[2.1rem] sm:text-[2.35rem] font-serif font-black text-navy-900 tracking-tight leading-tight'>
            Checkout
          </h1>
          <p className='mt-1 text-[13px] sm:text-base text-gray-500 max-w-2xl'>
            Secure checkout.{" "}
            {existingOrder ?
              "Complete your payment to confirm this order."
            : "Cash on delivery is available for your order."}
          </p>
        </header>

        {showMobileCheckoutWizard && (
          <div
            className='mb-2 rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm sm:p-5 lg:hidden overflow-hidden'
            aria-label='Checkout steps'
          >
            <div className='flex items-center'>
              {(
                [
                  { step: 1, label: "Shipping" },
                  { step: 2, label: "Payment" },
                  { step: 3, label: "Review" },
                ] as const
              ).map(({ step, label }, idx) => (
                <Fragment key={step}>
                  <button
                    type='button'
                    onClick={() => void goToMobileStep(step)}
                    className={cn(
                      "min-w-0 flex-1 h-[54px] rounded-xl border px-2 py-1 text-center transition-all duration-250",
                      mobileCheckoutStep >= step ?
                        "border-[#b02a37]/35 bg-red-50/60 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <div
                      className={cn(
                        "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition-colors duration-250",
                        mobileCheckoutStep >= step ?
                          "bg-[#b02a37] text-white shadow"
                        : "bg-gray-200 text-gray-500",
                      )}
                    >
                      {step}
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-[9px] font-bold uppercase leading-tight tracking-[0.07em] text-gray-600",
                        mobileCheckoutStep === step && "text-[#b02a37]",
                      )}
                    >
                      {label}
                    </p>
                  </button>

                  {idx < 2 && (
                    <div className='mx-1 w-6 shrink-0'>
                      <div className='h-0.5 w-full rounded-full bg-gray-200 overflow-hidden'>
                        <div
                          className='h-full rounded-full bg-[#b02a37] transition-all duration-300'
                          style={{
                            width: mobileCheckoutStep > step ? "100%" : "0%",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}

        <form
          className='min-w-0'
          onSubmit={(e) => {
            if (showMobileCheckoutWizard && mobileCheckoutStep < 3) {
              e.preventDefault();
              return;
            }
            void handleSubmit(onSubmit)(e);
          }}
        >
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-8 xl:gap-10 min-w-0 items-start'>
            <div className='lg:col-span-7 space-y-6 min-w-0'>
              {(!showMobileCheckoutWizard || mobileCheckoutStep === 1) && (
                <section className='rounded-2xl bg-white p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100/90 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-right-2 lg:slide-in-from-right-0'>
                  <div className='flex items-center gap-2.5 mb-6'>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-red-50",
                        checkoutAccent,
                      )}
                    >
                      <MapPin className='h-5 w-5' strokeWidth={2} />
                    </div>
                    <h2 className='text-lg sm:text-xl font-bold text-navy-900'>
                      Shipping address
                    </h2>
                  </div>

                  <div className='mb-2 rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3'>
                    <p className='text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold'>
                      Email
                    </p>
                    <p className='mt-1 text-sm font-semibold text-gray-900 break-all'>
                      {user?.email || "—"}
                    </p>
                  </div>

                  {showManualAddressPreview && (
                    <div className='mb-2 rounded-2xl border-2 border-[#b02a37]/40 bg-red-50/40 p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <p className='flex items-center gap-2 text-sm font-black text-navy-900'>
                            <Home className='h-4 w-4 shrink-0 text-[#b02a37]' />
                            New address
                          </p>
                          <p className='mt-1 text-sm text-gray-700'>
                            {getValues("name")} · {getValues("phone")}
                          </p>
                          <p className='mt-1 text-sm text-gray-600 leading-relaxed'>
                            {getValues("house") && (
                              <>
                                {getValues("house")}
                                <br />
                              </>
                            )}
                            {getValues("street")}
                            {getValues("landmark") && (
                              <>
                                <br />
                                <span className='text-gray-500'>
                                  Landmark: {getValues("landmark")}
                                </span>
                              </>
                            )}
                            <br />
                            {getValues("city")} {getValues("state")}{" "}
                            {getValues("pincode")}
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={() => {
                            setShowShippingForm(true);
                            requestAnimationFrame(() =>
                              shippingFieldsRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              }),
                            );
                          }}
                          className='inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#b02a37]/35 bg-white px-3 py-1.5 text-xs font-bold text-[#b02a37] shadow-sm transition hover:bg-red-50'
                        >
                          <Pencil className='h-3.5 w-3.5' />
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {user?.addresses && user.addresses.length > 0 && (
                    <div className='mb-2'>
                      <p className='text-sm font-bold text-navy-900 mb-3'>
                        Saved addresses
                      </p>
                      <div className='space-y-3'>
                        {(user.addresses || []).map((addr) => (
                          <div key={addr._id} className='relative'>
                            <label
                              className={cn(
                                "flex items-start gap-3 rounded-2xl border-2 p-4 pr-24 cursor-pointer transition-all duration-300",
                                selectedAddressId === addr._id ?
                                  cn(
                                    "border-[#b02a37] bg-red-50/50 shadow-sm",
                                    checkoutRing,
                                    "ring-1",
                                  )
                                : "border-gray-200 hover:border-gray-300 bg-white",
                              )}
                            >
                              <input
                                type='radio'
                                name='savedAddress'
                                value={addr._id}
                                checked={selectedAddressId === addr._id}
                                onChange={() => {
                                  loadAddress(addr._id!);
                                  setShowShippingForm(false);
                                }}
                                className='mt-1 h-4 w-4 accent-[#b02a37]'
                              />
                              <div className='min-w-0 flex-1 text-sm'>
                                <p className='flex items-center gap-2 font-bold text-navy-900'>
                                  <Home className='h-4 w-4 shrink-0 opacity-70' />
                                  {addr.label || "Address"}
                                </p>
                                <p className='mt-1 text-gray-600'>
                                  {addr.name} · {addr.phone}
                                </p>
                                <p className='mt-1 text-gray-600 leading-relaxed'>
                                  {addr.street}, {addr.city}, {addr.state}{" "}
                                  {addr.pincode}
                                </p>
                              </div>
                            </label>
                            <button
                              type='button'
                              onClick={() => {
                                loadAddress(addr._id!);
                                setShowShippingForm(true);
                                requestAnimationFrame(() =>
                                  scrollToShippingFields(),
                                );
                              }}
                              className='absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#b02a37]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#b02a37] shadow-sm transition hover:bg-red-50'
                            >
                              <Pencil className='h-3.5 w-3.5' />
                              Edit
                            </button>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!addr._id) return;
                                void removeSavedAddress(addr._id);
                              }}
                              className='absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-50'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </button>
                          </div>
                        ))}
                        <button
                          type='button'
                          onClick={() => openNewAddressForm()}
                          className='text-sm font-bold text-[#b02a37] hover:text-[#8f222c] transition-colors'
                        >
                          + Add new address
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    ref={shippingFieldsRef}
                    id='checkout-shipping-fields'
                    className={cn(
                      "scroll-mt-28 space-y-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/30 p-4 sm:p-5 transition-all duration-300",
                      !showShippingForm && "hidden",
                    )}
                    aria-hidden={!showShippingForm}
                  >
                    <p className='text-xs font-bold uppercase tracking-widest text-gray-400'>
                      {selectedAddressId ? "Edit address" : "Delivery details"}
                    </p>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <Input
                        id='checkout-field-name'
                        {...register("name")}
                        label='Full name'
                        placeholder='e.g. Your Name'
                        error={errors.name?.message}
                      />
                      <Input
                        id='checkout-field-phone'
                        {...register("phone")}
                        label='Mobile number'
                        placeholder='e.g. 9876543210'
                        hint='10-digit Indian mobile'
                        error={errors.phone?.message}
                        inputMode='tel'
                        autoComplete='tel'
                      />
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                      <Input
                        id='checkout-field-house'
                        {...register("house")}
                        label='House / Flat / Building'
                        placeholder='e.g. B-203, Tower 4'
                        error={errors.house?.message}
                        autoComplete='address-line1'
                      />
                      <Input
                        id='checkout-field-street'
                        {...register("street")}
                        label='Street & Area'
                        placeholder='Street name, locality / sector'
                        error={errors.street?.message}
                        autoComplete='address-line2'
                      />
                      <Input
                        id='checkout-field-landmark'
                        {...register("landmark")}
                        label='Landmark (optional)'
                        placeholder='e.g. Near City Mall'
                        error={errors.landmark?.message}
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <Input
                        id='checkout-field-city'
                        {...register("city")}
                        label='City'
                        placeholder='City'
                        error={errors.city?.message}
                        autoComplete='address-level2'
                      />
                      <div>
                        <label
                          htmlFor='checkout-field-state'
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          State
                        </label>
                        <select
                          id='checkout-field-state'
                          {...register("state")}
                          aria-invalid={errors.state ? true : undefined}
                          className={cn(
                            "w-full h-10 px-3 border rounded-xl text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#b02a37]/30 bg-white",
                            errors.state ?
                              "border-red-500 focus:ring-red-500/40"
                            : "border-input",
                          )}
                        >
                          <option value=''>Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <p className='text-xs text-red-600 mt-1 animate-in fade-in duration-200'>
                            {errors.state.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Input
                      id='checkout-field-pincode'
                      {...register("pincode")}
                      label='Pincode'
                      placeholder='6-digit PIN'
                      maxLength={6}
                      inputMode='numeric'
                      pattern='[0-9]*'
                      hint='6-digit area PIN'
                      error={errors.pincode?.message}
                      autoComplete='postal-code'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full rounded-xl border-[#b02a37]/40 font-bold text-[#b02a37] hover:bg-red-50'
                      onClick={() => void confirmShippingForm()}
                    >
                      Save &amp; use this address
                    </Button>
                  </div>
                  {showMobileCheckoutWizard && mobileCheckoutStep === 1 && (
                    <div className='mt-6 lg:hidden'>
                      <Button
                        type='button'
                        variant='brand'
                        size='xl'
                        className='h-12 w-full rounded-2xl bg-[#b02a37] hover:bg-[#8f222c] text-base font-black shadow-lg'
                        onClick={() => void goToMobilePaymentStep()}
                      >
                        Continue to payment
                        <ArrowRight className='ml-2 h-4 w-4' aria-hidden />
                      </Button>
                    </div>
                  )}
                </section>
              )}

              {(!showMobileCheckoutWizard || mobileCheckoutStep === 2) && (
                <section className='rounded-2xl bg-white p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100/90 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-right-2 lg:slide-in-from-right-0'>
                  <div className='flex items-center gap-2.5 mb-5'>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-red-50",
                        checkoutAccent,
                      )}
                    >
                      <Truck className='h-5 w-5' strokeWidth={2} />
                    </div>
                    <h2 className='text-lg sm:text-xl font-bold text-navy-900'>
                      Payment method
                    </h2>
                  </div>

                  {existingOrder ?
                    <div className='rounded-2xl border-2 border-[#b02a37]/25 bg-gradient-to-br from-red-50/80 to-white p-5 transition-transform duration-300'>
                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='h-6 w-6 text-[#b02a37] shrink-0 mt-0.5' />
                        <div>
                          <p className='font-bold text-navy-900'>
                            Complete payment
                          </p>
                          <p className='text-sm text-gray-600 mt-1 leading-relaxed'>
                            You&apos;ll finish payment on the next step after
                            placing your order. Secure processing only.
                          </p>
                        </div>
                      </div>
                    </div>
                  : <>
                      <button
                        type='button'
                        onClick={() => setCheckoutPaymentMethod("razorpay")}
                        className={cn(
                          "mb-3 w-full rounded-2xl border-2 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-5 text-left shadow-sm transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-1",
                          checkoutPaymentMethod === "razorpay" ?
                            "border-emerald-600 ring-2 ring-emerald-500/25"
                          : "border-gray-200 hover:border-emerald-400/50",
                        )}
                      >
                        <div className='flex items-start gap-3'>
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md",
                              checkoutPaymentMethod === "razorpay" ?
                                "bg-emerald-600 text-white"
                              : "bg-white text-emerald-600 ring-1 ring-gray-200",
                            )}
                          >
                            <Wallet className='h-5 w-5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='font-bold text-navy-900'>
                              Pay online
                            </p>
                            <p className='text-sm text-gray-600 mt-1 leading-relaxed'>
                              UPI, cards &amp; net banking. No Extra Charges.
                            </p>
                          </div>
                          <CheckCircle2
                            className={cn(
                              "h-6 w-6 shrink-0",
                              checkoutPaymentMethod === "razorpay" ?
                                "text-emerald-600"
                              : "text-gray-300",
                            )}
                          />
                        </div>
                      </button>

                      <button
                        type='button'
                        onClick={() => setCheckoutPaymentMethod("cod")}
                        className={cn(
                          "w-full rounded-2xl border-2 bg-gradient-to-br from-red-50 via-white to-red-50/30 p-5 text-left shadow-sm transition-all duration-300 hover:shadow-md animate-in fade-in zoom-in-95",
                          checkoutPaymentMethod === "cod" ?
                            "border-[#b02a37] ring-2 ring-[#b02a37]/20"
                          : "border-gray-200 hover:border-[#b02a37]/40",
                        )}
                      >
                        <div className='flex items-start gap-3'>
                          <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b02a37] text-white shadow-md'>
                            <Banknote className='h-5 w-5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='font-bold text-navy-900'>
                              Cash on delivery (COD)
                            </p>
                            <p className='text-sm text-gray-600 mt-1 leading-relaxed'>
                              Pay when your order arrives. A one-time{" "}
                              <span className='font-semibold text-navy-900'>
                                {formatPrice(COD_HANDLING_FEE)} COD fee .
                              </span>
                            </p>
                          </div>
                          <CheckCircle2
                            className={cn(
                              "h-6 w-6 shrink-0",
                              checkoutPaymentMethod === "cod" ? "text-[#b02a37]"
                              : "text-gray-300",
                            )}
                          />
                        </div>
                      </button>
                    </>
                  }
                  {showMobileCheckoutWizard && mobileCheckoutStep === 2 && (
                    <div className='mt-2 flex flex-col gap-3 lg:hidden'>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-11 w-full rounded-xl border-gray-200 font-bold'
                        onClick={() => setMobileCheckoutStep(1)}
                      >
                        Back to shipping
                      </Button>
                      <Button
                        type='button'
                        variant='brand'
                        size='xl'
                        className='h-12 w-full rounded-2xl bg-[#b02a37] hover:bg-[#8f222c] text-base font-black shadow-lg'
                        onClick={goToMobileReviewStep}
                      >
                        Review order &amp; pay
                        <ArrowRight className='ml-2 h-4 w-4' aria-hidden />
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Summary + coupons: visible on all steps (mobile) so apply / View all always work; navbar is z-50 so coupon modal uses a portal */}
            {(!showMobileCheckoutWizard || mobileCheckoutStep === 3) && (
              <div className='lg:col-span-5 min-w-0 animate-in fade-in slide-in-from-right-2 lg:slide-in-from-right-0'>
                <div className='rounded-2xl bg-white p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100/90 lg:sticky lg:top-24 min-w-0 max-w-full transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]'>
                  {showMobileCheckoutWizard && mobileCheckoutStep === 3 && (
                    <Button
                      type='button'
                      variant='ghost'
                      className='mb-2 -ml-1 h-10 px-2 text-sm font-bold text-gray-600 hover:text-gray-900 lg:hidden'
                      onClick={() => setMobileCheckoutStep(2)}
                    >
                      ← Back to payment
                    </Button>
                  )}
                  {/* Coupons (shown above order items) */}
                  <div className='mb-5 pb-5 border-b border-gray-100 min-w-0'>
                    <div className='flex items-center justify-between gap-2 mb-3 min-w-0'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <BadgePercent className='h-5 w-5 text-brand-600 shrink-0' />
                        <h2 className='text-lg font-semibold text-gray-900 truncate'>
                          Coupons
                        </h2>
                      </div>
                      {eligibleCoupons.length > 2 && (
                        <button
                          type='button'
                          onClick={() => setIsAllCouponsOpen(true)}
                          className='text-sm font-semibold text-brand-600 hover:text-brand-700 shrink-0'
                        >
                          View all
                        </button>
                      )}
                    </div>

                    {hasAppliedCoupon ?
                      <div className='rounded-xl border border-green-200 bg-green-50 p-3 min-w-0 space-y-3'>
                        <div className='flex items-start gap-2 min-w-0'>
                          <Tag
                            className='h-4 w-4 text-green-600 shrink-0 mt-0.5'
                            aria-hidden
                          />
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium text-green-900 break-words'>
                              <span className='font-semibold tracking-wide'>
                                {activeCouponCode || "Coupon"}
                              </span>
                              <span className='text-green-800'>
                                {" "}
                                · You save {formatPrice(activeCouponDiscount)}
                              </span>
                            </p>
                            <p className='text-xs text-green-800/75 mt-1'>
                              The discount is reflected in your order total
                              below.
                            </p>
                          </div>
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='w-full border-red-200/80 text-red-700 hover:bg-red-50 hover:text-red-800'
                          disabled={couponBusy}
                          onClick={async () => {
                            setCouponBusy(true);
                            try {
                              await removeSelectedCoupon();
                            } finally {
                              setCouponBusy(false);
                            }
                          }}
                        >
                          {couponBusy ? "Removing…" : "Remove coupon"}
                        </Button>
                      </div>
                    : <div className='flex flex-col gap-2 sm:flex-row sm:items-stretch min-w-0'>
                        <input
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder='Enter coupon code'
                          autoComplete='off'
                          className='min-w-0 w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b02a37]/35'
                        />
                        <Button
                          type='button'
                          variant='brand'
                          className='w-full sm:w-auto shrink-0 sm:min-w-[5.5rem] h-11 rounded-xl bg-[#b02a37] hover:bg-[#8f222c] border-0 shadow-md transition-transform active:scale-[0.98]'
                          disabled={couponBusy || !couponCode.trim()}
                          onClick={async () => {
                            if (!couponCode.trim()) return;
                            setCouponBusy(true);
                            try {
                              await applySelectedCoupon(couponCode.trim());
                              setCouponCode("");
                            } catch {
                              /* toast from store */
                            } finally {
                              setCouponBusy(false);
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    }

                    {isLoadingCoupons ?
                      <div className='text-sm text-gray-500 mt-3'>
                        Loading available offers…
                      </div>
                    : eligibleCoupons.length === 0 ?
                      <div className='text-sm text-gray-500 mt-3'>
                        No coupons are available for this order.
                      </div>
                    : <div className='grid grid-cols-1 gap-2 mt-3 min-w-0'>
                        {eligibleCoupons.slice(0, 2).map((c) => (
                          <button
                            key={c._id}
                            type='button'
                            disabled={hasAppliedCoupon || couponBusy}
                            title={
                              hasAppliedCoupon ?
                                "Remove your current coupon to use another"
                              : undefined
                            }
                            onClick={async () => {
                              try {
                                await applySelectedCoupon(c.code);
                              } catch {
                                // store handles toast
                              }
                            }}
                            className={cn(
                              "text-left p-3 rounded-xl border border-gray-200 transition-all min-w-0",
                              hasAppliedCoupon || couponBusy ?
                                "opacity-50 cursor-not-allowed"
                              : "hover:border-brand-300 hover:bg-brand-50",
                            )}
                          >
                            <div className='flex items-center justify-between gap-2 min-w-0'>
                              <span className='font-mono font-bold text-sm text-brand-700 truncate min-w-0'>
                                {c.code}
                              </span>
                              <span className='text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase'>
                                {c.eligibilityType === "first_order" ?
                                  "First Order"
                                : c.eligibilityType === "returning" ?
                                  "Returning"
                                : "All Users"}
                              </span>
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                              {c.discountType === "percentage" ?
                                `${c.discountValue}% off`
                              : `${formatPrice(c.discountValue)} off`}
                              {c.minOrderAmount ?
                                ` · Min ${formatPrice(c.minOrderAmount)}`
                              : ""}
                            </p>
                          </button>
                        ))}
                      </div>
                    }
                  </div>

                  <button
                    type='button'
                    className='flex items-center justify-between w-full mb-3 lg:cursor-default min-w-0 gap-2 group'
                    onClick={() => setShowItems(!showItems)}
                  >
                    <div className='flex items-center gap-2 min-w-0 flex-wrap'>
                      <Package className='h-5 w-5 text-[#b02a37] shrink-0 transition-transform group-hover:scale-105' />
                      <h2 className='text-lg font-bold text-navy-900 truncate text-left'>
                        Order summary · {checkoutItems.length}{" "}
                        {checkoutItems.length === 1 ? "item" : "items"}
                      </h2>
                      {buyNowItem && !existingOrder && (
                        <span className='inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#b02a37] border border-[#b02a37]/20'>
                          Quick buy
                        </span>
                      )}
                    </div>
                    <span className='lg:hidden text-gray-400'>
                      {showItems ?
                        <ChevronUp className='h-4 w-4' />
                      : <ChevronDown className='h-4 w-4' />}
                    </span>
                  </button>

                  <div
                    className={cn(
                      "space-y-4 mb-6",
                      showItems ? "block" : "hidden lg:block",
                    )}
                  >
                    {checkoutItems.map((item, lineIndex) => {
                      const row = toCheckoutRowDisplay(item, !!existingOrder);
                      const rowKey =
                        existingOrder ?
                          `ord-${existingOrder._id}-${lineIndex}-${row.variant?.sku || "i"}`
                        : buyNowItem ?
                          `bn-${buyNowItem.productId}-${row.variant?.sku || "sku"}`
                        : "product" in item ? cartLineReactKey(item as CartItem)
                        : `line-${lineIndex}-${row.name || "x"}`;
                      const thumb =
                        row.thumbUrl ||
                        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=70";
                      const cartLine =
                        (
                          !existingOrder &&
                          !buyNowItem &&
                          cart &&
                          "product" in item
                        ) ?
                          (item as CartItem)
                        : null;
                      const sku = cartLine?.variant?.sku;
                      const buyNowSku =
                        buyNowItem && !existingOrder ?
                          buyNowItem.variant.sku
                        : undefined;
                      const lineBusy = Boolean(
                        (sku && lineBusySku === sku) ||
                        (buyNowSku && lineBusySku === buyNowSku),
                      );
                      const maxLineQty =
                        cartLine && sku ?
                          Math.min(
                            10,
                            Math.max(
                              1,
                              cartLine.product?.variants?.find(
                                (v) => v.sku === sku,
                              )?.stock ?? 10,
                            ),
                          )
                        : buyNowItem && !existingOrder ?
                          Math.min(10, Math.max(1, buyNowItem.maxStock ?? 10))
                        : 10;
                      const showCartLineControls = Boolean(cartLine && sku);
                      const showBuyNowLineControls = Boolean(
                        buyNowItem && !existingOrder && buyNowSku,
                      );
                      const showRemovableLine =
                        showCartLineControls || showBuyNowLineControls;
                      return (
                        <div
                          key={rowKey}
                          className='flex items-stretch gap-3 min-w-0 rounded-2xl border border-gray-100 bg-gray-50/40 p-3 transition-all duration-300 hover:bg-gray-50 animate-in fade-in slide-in-from-bottom-1'
                        >
                          <div className='relative h-[4.5rem] w-[3.75rem] shrink-0 self-start overflow-hidden rounded-xl bg-white shadow-inner ring-1 ring-black/5'>
                            <Image
                              src={thumb}
                              alt={row.name || "Product"}
                              fill
                              sizes='72px'
                              className='object-cover'
                            />
                            {!cartLine && !buyNowItem && (
                              <span className='absolute bottom-1 right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#b02a37] px-1 text-[10px] font-bold text-white shadow'>
                                {row.quantity}
                              </span>
                            )}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-bold text-navy-900 line-clamp-2 leading-snug'>
                              {row.name || "Product"}
                            </p>
                            <p className='text-xs text-gray-500 mt-0.5'>
                              {[row.variant?.size, row.variant?.color]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            {(row.customFieldAnswers?.length ?? 0) > 0 && (
                              <div className='mt-1.5 grid grid-cols-1 gap-1'>
                                {(row.customFieldAnswers || []).map(
                                  (
                                    ans: { label: string; value: string },
                                    i: number,
                                  ) => {
                                    const isImage =
                                      typeof ans.value === "string" &&
                                      /^https?:\/\//.test(ans.value);
                                    return (
                                      <div
                                        key={i}
                                        className='inline-flex items-center gap-2 text-[10px] bg-gold-50 border border-gold-100 rounded-md px-2 py-1'
                                      >
                                        <span className='font-semibold text-gold-700'>
                                          {ans.label}:
                                        </span>
                                        {isImage ?
                                          <a
                                            href={ans.value}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='inline-flex items-center gap-1'
                                          >
                                            <span className='relative h-7 w-7 rounded overflow-hidden border border-gold-200 bg-white'>
                                              <Image
                                                src={ans.value}
                                                alt={ans.label}
                                                fill
                                                sizes='28px'
                                                className='object-cover'
                                              />
                                            </span>
                                            <span className='font-semibold text-[#b02a37]'>
                                              View
                                            </span>
                                          </a>
                                        : <span className='font-medium text-gray-700 break-words'>
                                            {ans.value}
                                          </span>
                                        }
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            )}
                            {showCartLineControls && sku && (
                              <div className='mt-3 inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 shadow-sm'>
                                <button
                                  type='button'
                                  disabled={lineBusy}
                                  onClick={() =>
                                    void bumpLineQty(
                                      sku,
                                      -1,
                                      row.quantity,
                                      maxLineQty,
                                    )
                                  }
                                  className='flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:opacity-40'
                                  aria-label={
                                    row.quantity <= 1 ?
                                      "Remove item"
                                    : "Decrease quantity"
                                  }
                                >
                                  <Minus className='h-3.5 w-3.5' />
                                </button>
                                <span className='min-w-[1.75rem] text-center text-sm font-bold tabular-nums'>
                                  {row.quantity}
                                </span>
                                <button
                                  type='button'
                                  disabled={
                                    lineBusy || row.quantity >= maxLineQty
                                  }
                                  onClick={() =>
                                    void bumpLineQty(
                                      sku,
                                      1,
                                      row.quantity,
                                      maxLineQty,
                                    )
                                  }
                                  className='flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:opacity-40'
                                  aria-label='Increase quantity'
                                >
                                  <Plus className='h-3.5 w-3.5' />
                                </button>
                              </div>
                            )}
                            {showBuyNowLineControls && buyNowSku && (
                              <div className='mt-3 inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 shadow-sm'>
                                <button
                                  type='button'
                                  disabled={lineBusy}
                                  onClick={() =>
                                    void bumpBuyNowQty(
                                      -1,
                                      row.quantity,
                                      maxLineQty,
                                    )
                                  }
                                  className='flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:opacity-40'
                                  aria-label={
                                    row.quantity <= 1 ?
                                      "Remove item"
                                    : "Decrease quantity"
                                  }
                                >
                                  <Minus className='h-3.5 w-3.5' />
                                </button>
                                <span className='min-w-[1.75rem] text-center text-sm font-bold tabular-nums'>
                                  {row.quantity}
                                </span>
                                <button
                                  type='button'
                                  disabled={
                                    lineBusy || row.quantity >= maxLineQty
                                  }
                                  onClick={() =>
                                    void bumpBuyNowQty(
                                      1,
                                      row.quantity,
                                      maxLineQty,
                                    )
                                  }
                                  className='flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:opacity-40'
                                  aria-label='Increase quantity'
                                >
                                  <Plus className='h-3.5 w-3.5' />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className='flex shrink-0 flex-col items-end justify-between gap-1 self-stretch py-0.5'>
                            <p className='text-sm font-bold text-navy-900 tabular-nums text-right leading-tight'>
                              {formatPrice(row.price * row.quantity)}
                            </p>
                            {showRemovableLine && (
                              <button
                                type='button'
                                disabled={lineBusy}
                                onClick={() => {
                                  if (showCartLineControls && sku) {
                                    void removeLine(sku);
                                  } else {
                                    void removeBuyNowLine();
                                  }
                                }}
                                className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50/90 hover:text-red-600 disabled:opacity-40'
                                aria-label='Remove item'
                                title='Remove'
                              >
                                <Trash2
                                  className='h-3.5 w-3.5'
                                  strokeWidth={2}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className='border-t border-gray-100 pt-5 space-y-2.5 text-sm'>
                    <div className='flex justify-between text-gray-600'>
                      <span>Subtotal</span>
                      <span className='font-medium tabular-nums'>
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className='flex justify-between text-emerald-600'>
                        <span>Discount</span>
                        <span className='font-semibold tabular-nums'>
                          − {formatPrice(discount)}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between gap-3 text-gray-600'>
                      <span className='min-w-0'>
                        Shipping
                        <span className='block text-[10px] font-normal text-gray-400 mt-0.5'>
                          Below {formatPrice(SHIPPING_THRESHOLD)} order value
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-semibold tabular-nums text-right",
                          shippingCharge === 0 && "text-emerald-600",
                        )}
                      >
                        {shippingCharge === 0 ?
                          "FREE"
                        : formatPrice(shippingCharge)}
                      </span>
                    </div>
                    {codFee > 0 && (
                      <div className='flex justify-between gap-3 text-gray-600'>
                        <span className='min-w-0'>
                          COD handling fee
                          <span className='block text-[10px] font-normal text-gray-400 mt-0.5'>
                            Cash on delivery only — not shipping
                          </span>
                        </span>
                        <span className='shrink-0 font-semibold tabular-nums'>
                          {formatPrice(codFee)}
                        </span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className='flex justify-between text-gray-600'>
                        <span>Tax</span>
                        <span className='font-semibold tabular-nums'>
                          {formatPrice(tax)}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between border-t border-gray-100 pt-3 text-base font-black text-navy-900'>
                      <span>Total</span>
                      <span className='tabular-nums'>{formatPrice(total)}</span>
                    </div>
                    {(shippingCharge > 0 || codFee > 0) && (
                      <p className='text-[10px] text-gray-500 mt-2 leading-snug'>
                        On returns, shipping and COD fees (if any) are not
                        refunded — only the product value portion. See{" "}
                        <Link
                          href='/terms'
                          className='text-brand-700 font-semibold underline-offset-2 hover:underline'
                        >
                          Terms
                        </Link>
                        .
                      </p>
                    )}
                  </div>

                  {(!showMobileCheckoutWizard || mobileCheckoutStep === 3) && (
                    <>
                      <Button
                        type='submit'
                        variant='brand'
                        size='xl'
                        className='w-full mt-6 h-14 text-center whitespace-normal leading-snug px-3 max-w-full rounded-2xl bg-[#b02a37] hover:bg-[#8f222c] border-0 text-base font-black shadow-lg shadow-red-900/15 transition-all duration-300 hover:shadow-xl hover:shadow-red-900/20 active:scale-[0.99]'
                        disabled={isPlacingOrder}
                      >
                        {existingOrder ?
                          `Pay now — ${formatPrice(total)}`
                        : checkoutPaymentMethod === "razorpay" ?
                          `Pay securely — ${formatPrice(total)}`
                        : `Place order — ${formatPrice(total)}`}
                      </Button>

                      <div className='mt-6 grid grid-cols-3 gap-2 text-center'>
                        {(
                          [
                            { Icon: Shield, label: "Secure checkout" },
                            { Icon: Truck, label: "Free delivery*" },
                            { Icon: RotateCcw, label: "Easy returns" },
                          ] as const
                        ).map(({ Icon, label }) => (
                          <div
                            key={label}
                            className='rounded-xl border border-gray-100 bg-gray-50/80 px-1 py-3 transition hover:border-[#b02a37]/25'
                          >
                            <Icon className='mx-auto h-5 w-5 text-[#b02a37]/90' />
                            <p className='mt-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 leading-tight'>
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className='text-[10px] text-center text-gray-400 mt-1'>
                        *Where applicable per policy
                      </p>

                      <p className='text-xs text-gray-500 text-center mt-4 leading-relaxed'>
                        {offerText}
                      </p>
                      <p className='text-[11px] text-gray-400 text-center mt-2'>
                        By placing this order, you agree to our{" "}
                        <Link
                          href='/terms'
                          className='text-[#b02a37] font-semibold underline-offset-2 hover:underline'
                        >
                          terms
                        </Link>{" "}
                        and{" "}
                        <Link
                          href='/privacy'
                          className='text-[#b02a37] font-semibold underline-offset-2 hover:underline'
                        >
                          privacy policy
                        </Link>
                        .
                      </p>
                    </>
                  )}
                  {showMobileCheckoutWizard &&
                    mobileCheckoutStep < 3 &&
                    !existingOrder && (
                      <p className='mt-6 text-center text-xs text-gray-500'>
                        Continue the steps above — you can place your order on
                        the last step.
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* See all coupons modal — portal + z-index above sticky nav (z-50) */}
        {typeof document !== "undefined" &&
          isAllCouponsOpen &&
          createPortal(
            <div className='fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 overflow-x-hidden'>
              <div
                className='absolute inset-0'
                role='presentation'
                onClick={() => setIsAllCouponsOpen(false)}
              />
              <div className='relative w-full max-w-[100vw] sm:max-w-lg min-w-0 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden'>
                <div className='p-4 border-b border-gray-100 flex items-center justify-between min-w-0 gap-2'>
                  <div className='min-w-0'>
                    <p className='text-xs uppercase tracking-widest text-gray-400 font-semibold'>
                      Promotional codes
                    </p>
                    <h3 className='text-lg font-bold text-gray-900 truncate'>
                      Available for your order
                    </h3>
                  </div>
                  <button
                    type='button'
                    onClick={() => setIsAllCouponsOpen(false)}
                    className='h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center'
                    aria-label='Close'
                  >
                    <span className='text-gray-600 text-lg leading-none'>
                      ×
                    </span>
                  </button>
                </div>
                <div className='p-4 overflow-y-auto overflow-x-hidden space-y-2 min-w-0'>
                  {eligibleCoupons.map((coupon) => (
                    <button
                      key={coupon._id}
                      type='button'
                      disabled={hasAppliedCoupon || couponBusy}
                      onClick={async () => {
                        try {
                          await applySelectedCoupon(coupon.code);
                          setIsAllCouponsOpen(false);
                        } catch {
                          // store handles toast
                        }
                      }}
                      className={cn(
                        "w-full min-w-0 text-left p-3 rounded-xl border border-gray-200 transition-all",
                        hasAppliedCoupon || couponBusy ?
                          "opacity-50 cursor-not-allowed"
                        : "hover:border-brand-300 hover:bg-brand-50",
                      )}
                    >
                      <div className='flex items-center justify-between gap-2 min-w-0'>
                        <span className='font-mono font-bold text-sm text-brand-700 truncate'>
                          {coupon.code}
                        </span>
                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase'>
                          {coupon.eligibilityType === "first_order" ?
                            "First Order"
                          : coupon.eligibilityType === "returning" ?
                            "Returning"
                          : "All Users"}
                        </span>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        {coupon.discountType === "percentage" ?
                          `${coupon.discountValue}% off`
                        : `${formatPrice(coupon.discountValue)} off`}
                        {coupon.minOrderAmount ?
                          ` · Min ${formatPrice(coupon.minOrderAmount)}`
                        : ""}
                      </p>
                      {coupon.description && (
                        <p className='text-xs text-gray-400 mt-1 line-clamp-2'>
                          {coupon.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
