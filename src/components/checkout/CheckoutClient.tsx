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
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Home,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  ShoppingBag,
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
import { Input } from "@/components/ui/input";
import { Coupon, Order } from "@/types";
import { CouponAppliedBanner } from "@/components/coupons/CouponAppliedBanner";
import { CouponOfferPreview } from "@/components/coupons/CouponOfferPreview";
import type { CheckoutDisplayItem } from "@/types/checkoutDisplay";
import {
  getRazorpayConstructor,
  RAZORPAY_THEME_COLOR,
  type RazorpayInstance,
  type RazorpaySuccessPayload,
} from "@/lib/razorpayTypes";
import { toCheckoutRowDisplay, type CheckoutRowDisplay } from "@/lib/checkoutDisplayHelpers";
import type { CartItem } from "@/types";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import OrderPlacementSuccessOverlay from "@/components/checkout/OrderPlacementSuccessOverlay";
import {
  heritageCta,
  heritagePageBg,
  heritageSectionCard,
  heritageSummaryCard,
} from "@/components/checkout/checkoutHeritageTheme";
import { trackPurchase, trackInitiateCheckout } from "@/lib/metaPixel";
import { trackGaPurchase, trackGaBeginCheckout } from "@/lib/googleAnalytics";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";

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

/** Matches backend Mongo ObjectId validation for order / checkout intent ids */
const MONGO_OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/;

function normalizeCheckoutMongoId(value: unknown): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return MONGO_OBJECT_ID_HEX.test(t) ? t : null;
  }
  if (
    value &&
    typeof value === "object" &&
    "$oid" in value &&
    typeof (value as { $oid: unknown }).$oid === "string"
  ) {
    const s = (value as { $oid: string }).$oid.trim();
    return MONGO_OBJECT_ID_HEX.test(s) ? s : null;
  }
  return null;
}

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
  variant: {
    size?: string;
    color?: string;
    colorCode?: string;
    sku: string;
    stock?: number;
    price?: number;
  };
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

type ReviewAddressDisplay = {
  name: string;
  phone: string;
  house?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
};

function CheckoutReviewRecap({
  address,
  paymentMethod,
  onEditAddress,
  onEditPayment,
  className,
}: {
  address: ReviewAddressDisplay;
  paymentMethod: "cod" | "razorpay";
  onEditAddress: () => void;
  onEditPayment: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className='mb-5 font-serif text-2xl font-medium text-navy-900 sm:mb-6 sm:text-3xl'>
        Review Your Order
      </h2>
      <div className='space-y-4'>
        <div className='flex items-start justify-between gap-4 border border-gray-200/70 bg-white p-5'>
          <div className='min-w-0'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400'>
              Shipping Address
            </p>
            <p className='mt-2 font-medium text-navy-900'>
              {address.name || "—"}
            </p>
            <p className='mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm'>
              {address.house && (
                <>
                  {address.house}
                  <br />
                </>
              )}
              {address.street || "—"}
              {address.landmark && (
                <>
                  <br />
                  Near {address.landmark}
                </>
              )}
              <br />
              {address.city}
              {address.city && address.state ? ", " : ""}
              {address.state} {address.pincode}
            </p>
            {address.phone && (
              <p className='mt-3 text-sm text-gray-600'>{address.phone}</p>
            )}
          </div>
          <button
            type='button'
            onClick={onEditAddress}
            className='shrink-0 border-b border-[#c5a059] pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c5a059] hover:text-navy-900'
          >
            Edit
          </button>
        </div>
        <div className='flex items-start justify-between gap-4 border border-gray-200/70 bg-white p-5'>
          <div className='min-w-0'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400'>
              Payment Method
            </p>
            <p className='mt-2 flex items-center gap-2 font-medium text-navy-900'>
              {paymentMethod === "razorpay" ? (
                <Wallet className='h-4 w-4 shrink-0 text-[#c5a059]' />
              ) : (
                <Banknote className='h-4 w-4 shrink-0 text-[#c5a059]' />
              )}
              <span className='text-sm sm:text-base'>
                {paymentMethod === "razorpay"
                  ? "Pay online (UPI, cards & net banking)"
                  : `Cash on delivery (${formatPrice(COD_HANDLING_FEE)} handling fee)`}
              </span>
            </p>
          </div>
          <button
            type='button'
            onClick={onEditPayment}
            className='shrink-0 border-b border-[#c5a059] pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c5a059] hover:text-navy-900'
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

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
  /** Step 1 shipping → 2 payment → 3 review & place order (all screen sizes) */
  const [checkoutStep, setCheckoutStep] = useState(1);
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
    purgeCartAfterCheckout,
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
  const watchedName = watch("name");
  const watchedPhone = watch("phone");
  const watchedHouse = watch("house");
  const watchedLandmark = watch("landmark");
  const watchedCity = watch("city");
  const watchedState = watch("state");
  const watchedPincode = watch("pincode");
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
      router.replace(loginUrlWithRedirect("/checkout"));
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

  const showCheckoutWizard = !existingOrder;

  const reviewAddressDisplay = useMemo((): ReviewAddressDisplay => {
    const saved =
      selectedAddressId && user?.addresses ?
        user.addresses.find((a) => a._id === selectedAddressId)
      : undefined;
    if (saved) {
      return {
        name: saved.name || user?.name || "",
        phone: saved.phone || user?.phone || "",
        house: saved.house,
        street: saved.street,
        landmark: saved.landmark,
        city: saved.city,
        state: saved.state,
        pincode: saved.pincode,
      };
    }
    return {
      name: watchedName || user?.name || "",
      phone: watchedPhone || user?.phone || "",
      house: watchedHouse,
      street: watchedStreet || "",
      landmark: watchedLandmark,
      city: watchedCity || "",
      state: watchedState || "",
      pincode: watchedPincode || "",
    };
  }, [
    selectedAddressId,
    user?.addresses,
    user?.name,
    user?.phone,
    watchedName,
    watchedPhone,
    watchedHouse,
    watchedStreet,
    watchedLandmark,
    watchedCity,
    watchedState,
    watchedPincode,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [checkoutStep]);

  useEffect(() => {
    if (checkoutStep === 3) setShowItems(true);
  }, [checkoutStep]);

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

  const goToPaymentStep = useCallback(async () => {
    const ok = await validateAddressFields();
    if (!ok) return;
    setCheckoutStep(2);
  }, [validateAddressFields]);

  const goToReviewStep = useCallback(async () => {
    const ok = await validateAddressFields();
    if (!ok) return;
    setCheckoutStep(3);
  }, [validateAddressFields]);

  const goToCheckoutStep = useCallback(
    async (targetStep: 1 | 2 | 3) => {
      if (targetStep === 1) {
        setCheckoutStep(1);
        return;
      }
      if (targetStep === 2) {
        await goToPaymentStep();
        return;
      }
      const ok = await validateAddressFields();
      if (!ok) return;
      setCheckoutStep(3);
    },
    [goToPaymentStep, validateAddressFields],
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

  const finalizeSuccessfulOrder = useCallback(
    async (order: Order) => {
      trackPurchase(order);
      trackGaPurchase(order);
      if (buyNowItem) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
        }
        setBuyNowItem(null);
      } else {
        await purgeCartAfterCheckout();
      }
      setPendingOrderSuccessId(order._id);
      setIsPlacingOrder(false);
    },
    [buyNowItem, purgeCartAfterCheckout],
  );

  const recoverFromAbortedPayment = useCallback(
    (opts?: { message?: string; asError?: boolean }) => {
      setIsPlacingOrder(false);
      void fetchCart().catch(() => {});
      const msg =
        opts?.message ??
        "Payment was not completed. You can try again when ready.";
      if (opts?.asError) toast.error(msg);
      else toast(msg, { duration: 5000 });
    },
    [fetchCart],
  );

  const bindRazorpayEvents = useCallback(
    (rzp: RazorpayInstance) => {
      rzp.on("payment.failed", (response) => {
        recoverFromAbortedPayment({
          message:
            response.error?.description ||
            response.error?.reason ||
            "Payment failed. Please try again.",
          asError: true,
        });
      });
    },
    [recoverFromAbortedPayment],
  );

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
          const resumeKeyId = razorpayOrder.keyId;
          if (!resumeKeyId) {
            toast.error(
              "Payment gateway is not configured. Try COD or contact support.",
            );
            return;
          }

          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

          const options = {
            key: resumeKeyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "The House of Rani",
            description: `Order ${existingOrder.orderNumber}`,
            order_id: razorpayOrder.id,
            handler: async (response: RazorpaySuccessPayload) => {
              setIsPlacingOrder(true);
              try {
                const verifyRes = await orderApi.verifyPayment({
                  orderId: existingOrder._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                holdPlacingUntilOverlay = true;
                await finalizeSuccessfulOrder(verifyRes.data.order);
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ?
                    err.message
                  : "Payment verification failed";
                toast.error(msg);
                await fetchCart().catch(() => {});
                setIsPlacingOrder(false);
              }
            },
            modal: {
              ondismiss: () => {
                recoverFromAbortedPayment({
                  message:
                    "Payment window closed. You can complete payment from your order details.",
                });
              },
            },
            prefill: {
              name: addressData.name,
              email: user?.email,
              contact: normalizedPhone,
            },
            theme: { color: RAZORPAY_THEME_COLOR },
          };

          const RazorpayCtor = getRazorpayConstructor();
          if (!RazorpayCtor) throw new Error("Razorpay SDK not available");
          const rzp = new RazorpayCtor(options);
          bindRazorpayEvents(rzp);
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
            const checkoutIntentId = normalizeCheckoutMongoId(
              "checkoutIntentId" in res.data ?
                (res.data as { checkoutIntentId?: unknown }).checkoutIntentId
              : undefined,
            );
            const legacyOrder =
              "order" in res.data &&
              (res.data as { order?: { _id?: string; orderNumber?: string } })
                .order ?
                (res.data as { order: { _id: string; orderNumber?: string } })
                  .order
              : null;
            const legacyOrderId =
              normalizeCheckoutMongoId(
                legacyOrder &&
                  typeof legacyOrder === "object" &&
                  legacyOrder !== null ?
                  (
                    legacyOrder as { _id?: unknown; id?: unknown }
                  )._id ??
                    (legacyOrder as { _id?: unknown; id?: unknown }).id
                : undefined,
              ) ?? "";
            if (!checkoutIntentId && !legacyOrderId) {
              toast.error(
                "Invalid payment session (missing checkout or order id). Please try again.",
              );
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
                    holdPlacingUntilOverlay = true;
                    await finalizeSuccessfulOrder(verifyRes.data.order);
                  } catch (err: unknown) {
                    const msg =
                      err instanceof Error ?
                        err.message
                      : "Payment verification failed";
                    toast.error(msg);
                    await fetchCart().catch(() => {});
                    setIsPlacingOrder(false);
                  }
                },
                modal: {
                  ondismiss: () => {
                    recoverFromAbortedPayment({
                      message:
                        checkoutIntentId ?
                          "Payment was not completed. You can try again when ready."
                        : "Payment window closed. You can complete payment from your order details.",
                    });
                  },
                },
                prefill: {
                  name: addressData.name,
                  email: user?.email,
                  contact: normalizedPhone,
                },
                theme: { color: RAZORPAY_THEME_COLOR },
              };

              const RazorpayCtor = getRazorpayConstructor();
              if (!RazorpayCtor) {
                toast.error("Razorpay is not available in this browser.");
                return;
              }
              const rzp = new RazorpayCtor(options);
              bindRazorpayEvents(rzp);
              rzp.open();
            };

            openRazorpay();
          } else {
            const { order } = res.data;
            holdPlacingUntilOverlay = true;
            await finalizeSuccessfulOrder(order);
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
      fetchCart,
      buyNowCouponCode,
      paymentMethodForApi,
      finalizeSuccessfulOrder,
      recoverFromAbortedPayment,
      bindRazorpayEvents,
    ],
  );

  const bumpLineQty = useCallback(
    async (cartItemId: string, sku: string, delta: number, current: number, maxQty: number) => {
      const next = current + delta;
      if (next < 1) {
        setLineBusySku(sku);
        try {
          await removeItem(cartItemId);
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
        await updateItem(cartItemId, capped);
      } finally {
        setLineBusySku(null);
      }
    },
    [updateItem, removeItem],
  );

  const removeLine = useCallback(
    async (cartItemId: string, sku: string) => {
      setLineBusySku(sku);
      try {
        await removeItem(cartItemId);
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
      <div
        className={cn(
          "flex min-h-[50vh] flex-col items-center justify-center px-4 py-24",
          heritagePageBg,
        )}
      >
        <Loader2
          className='mx-auto mb-4 h-10 w-10 animate-spin text-[#c5a059]'
          aria-hidden
        />
        <p className='text-sm text-gray-600'>Preparing checkout…</p>
      </div>
    );

  if (
    !existingOrder &&
    !buyNowItem &&
    (!cart || cart.items.length === 0) &&
    !pendingOrderSuccessId
  ) {
    return (
      <div
        className={cn(
          "flex min-h-[min(70vh,calc(100dvh-14rem))] flex-col items-center justify-center px-4 py-12 sm:py-16",
          heritagePageBg,
        )}
      >
        <div className='w-full max-w-md border border-gray-200/80 bg-white px-6 py-10 text-center sm:px-10 sm:py-14'>
          <ShoppingBag
            className='mx-auto mb-6 h-10 w-10 text-[#c5a059]'
            strokeWidth={1.25}
            aria-hidden
          />
          <h1 className='mb-3 font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl'>
            Checkout
          </h1>
          <div className='gold-divider mx-auto mb-5 w-16' aria-hidden />
          <p className='mb-8 text-sm leading-relaxed text-gray-600 sm:text-base'>
            Your bag is empty. Add pieces you love, then return here to complete
            your order.
          </p>
          <Link
            href='/shop'
            className='inline-block border-b border-navy-900 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900 transition-colors hover:border-[#c5a059] hover:text-[#c5a059]'
          >
            Explore Collections
          </Link>
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

  const scrollToShippingFields = () => {
    shippingFieldsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className={cn("w-full min-w-0 overflow-x-hidden", heritagePageBg)}>
      <OrderPlacementSuccessOverlay
        isOpen={isPlacingOrder || Boolean(pendingOrderSuccessId)}
        orderId={pendingOrderSuccessId}
      />
      <div className='mx-auto box-border min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12'>
        <header className='mb-8 lg:mb-10'>
          <h1 className='font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl'>
            Checkout
          </h1>
          <p className='mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base'>
            Secure checkout.{" "}
            {existingOrder
              ? "Complete your payment to confirm this order."
              : "Cash on delivery is available for your order."}
          </p>
        </header>

        {showCheckoutWizard && (
          <nav
            className='relative mb-8 flex items-center justify-between lg:hidden'
            aria-label='Checkout steps'
          >
            <div className='absolute left-0 top-4 -z-10 h-px w-full bg-gray-200' />
            {(
              [
                { step: 1, label: "Shipping" },
                { step: 2, label: "Payment" },
                { step: 3, label: "Review" },
              ] as const
            ).map(({ step, label }) => (
              <button
                key={step}
                type='button'
                onClick={() => void goToCheckoutStep(step)}
                className='flex flex-col items-center bg-[#f8f9fa] px-2'
              >
                <span
                  className={cn(
                    "mb-1 flex h-8 w-8 items-center justify-center text-[11px] font-semibold",
                    checkoutStep >= step
                      ? "bg-navy-900 text-white"
                      : "border border-gray-300 text-gray-400",
                  )}
                >
                  {step}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide text-navy-900",
                    checkoutStep < step && "opacity-40",
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </nav>
        )}

        {showCheckoutWizard && (
          <nav
            className='mb-8 hidden items-center gap-10 border-b border-gray-200/70 lg:flex xl:gap-14'
            aria-label='Checkout progress'
          >
            {(
              [
                { step: 1, label: "Shipping" },
                { step: 2, label: "Payment" },
                { step: 3, label: "Review" },
              ] as const
            ).map(({ step, label }) => (
              <button
                key={step}
                type='button'
                onClick={() => void goToCheckoutStep(step)}
                className={cn(
                  "flex items-center gap-2 pb-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors",
                  checkoutStep === step
                    ? "border-b-2 border-navy-900 text-navy-900"
                    : checkoutStep > step
                      ? "border-b-2 border-transparent text-navy-900/70 hover:text-navy-900"
                      : "border-b-2 border-transparent text-gray-400 opacity-50",
                )}
              >
                <span className='text-[10px] tracking-widest'>
                  {String(step).padStart(2, "0")}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}

        <form
          className='min-w-0'
          onSubmit={(e) => {
            if (showCheckoutWizard && checkoutStep < 3) {
              e.preventDefault();
              return;
            }
            void handleSubmit(onSubmit)(e);
          }}
        >
          <div className='grid min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-8'>
            <div
              className={cn(
                "min-w-0 space-y-8 lg:col-span-8",
                showCheckoutWizard && checkoutStep === 3 && "hidden lg:block",
              )}
            >
              {(!showCheckoutWizard || checkoutStep === 1) && (
                <section className={heritageSectionCard}>
                  <h2 className='mb-6 font-serif text-2xl font-medium text-navy-900 sm:text-3xl'>
                    Shipping Address
                  </h2>

                  <div className='mb-6 border border-gray-200/70 bg-[#f8f9fa] px-4 py-3 sm:px-5'>
                    <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400'>
                      Email
                    </p>
                    <p className='mt-1 break-all text-sm font-medium text-navy-900'>
                      {user?.email || "—"}
                    </p>
                  </div>

                  {showManualAddressPreview && (
                    <div className='relative mb-6 border-2 border-navy-900 bg-[#f8f9fa] p-5 sm:p-6'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <p className='flex items-center gap-2 text-sm font-semibold text-navy-900'>
                            <Home className='h-4 w-4 shrink-0 text-[#c5a059]' />
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
                          className='shrink-0 border-b border-[#c5a059] pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c5a059] transition-colors hover:text-navy-900'
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {user?.addresses && user.addresses.length > 0 && (
                    <div className='mb-6'>
                      <p className='mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500'>
                        Saved addresses
                      </p>
                      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
                        {(user.addresses || []).map((addr) => (
                          <div key={addr._id} className='relative'>
                            <label
                              className={cn(
                                "address-card block cursor-pointer border p-6 transition-all duration-300 sm:p-8",
                                selectedAddressId === addr._id
                                  ? "border-2 border-navy-900 bg-[#f8f9fa]"
                                  : "border border-gray-200/70 bg-white hover:border-[#c5a059]/50",
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
                                className='sr-only'
                              />
                              {selectedAddressId === addr._id && (
                                <CheckCircle2
                                  className='absolute right-4 top-4 h-5 w-5 fill-[#c5a059] text-[#c5a059]'
                                  aria-hidden
                                />
                              )}
                              <div className='min-w-0 pr-6 text-sm'>
                                <h3 className='font-serif text-lg font-medium text-navy-900'>
                                  {addr.name}
                                </h3>
                                <p className='mt-2 leading-relaxed text-gray-600'>
                                  {addr.street}
                                  <br />
                                  {addr.city}, {addr.state} {addr.pincode}
                                  <br />
                                  India
                                </p>
                                <p className='mt-4 text-gray-600'>
                                  {addr.phone}
                                </p>
                              </div>
                            </label>
                            <div className='mt-3 flex gap-4 px-1'>
                              <button
                                type='button'
                                onClick={() => {
                                  loadAddress(addr._id!);
                                  setShowShippingForm(true);
                                  requestAnimationFrame(() =>
                                    scrollToShippingFields(),
                                  );
                                }}
                                className='text-[10px] font-semibold uppercase tracking-wide text-[#c5a059] hover:underline'
                              >
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
                                className='text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:text-red-600'
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type='button'
                        onClick={() => openNewAddressForm()}
                        className='mt-6 w-full border-2 border-dashed border-gray-300 py-8 transition-all hover:border-[#c5a059] hover:bg-[#fff8eb]/40'
                      >
                        <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500'>
                          + Add New Address
                        </span>
                      </button>
                    </div>
                  )}

                  <div
                    ref={shippingFieldsRef}
                    id='checkout-shipping-fields'
                    className={cn(
                      "scroll-mt-28 space-y-4 border border-dashed border-gray-300 bg-[#f8f9fa]/50 p-4 transition-all duration-300 sm:p-5",
                      !showShippingForm && "hidden",
                    )}
                    aria-hidden={!showShippingForm}
                  >
                    <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400'>
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
                            "h-10 w-full rounded-none border bg-white px-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#c5a059]/40",
                            errors.state
                              ? "border-red-500 focus:ring-red-500/40"
                              : "border-gray-300",
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
                    <button
                      type='button'
                      className={cn(heritageCta, "mt-2")}
                      onClick={() => void confirmShippingForm()}
                    >
                      Save &amp; Use This Address
                    </button>
                  </div>

                  <section className='mt-8 border-t border-gray-200/70 pt-8'>
                    <h2 className='mb-4 font-serif text-2xl font-medium text-navy-900 sm:mb-6 sm:text-3xl'>
                      Shipping Method
                    </h2>
                    <div className='flex items-center justify-between border border-gray-200/70 bg-white p-5 sm:p-6'>
                      <div className='flex items-center gap-4'>
                        <div className='flex h-5 w-5 items-center justify-center rounded-full border-2 border-navy-900'>
                          <div className='h-2.5 w-2.5 rounded-full bg-navy-900' />
                        </div>
                        <div>
                          <p className='text-sm font-semibold text-navy-900'>
                            Standard Delivery
                          </p>
                          <p className='mt-0.5 text-xs text-gray-500'>
                            Arrives in 5–7 business days across India.
                          </p>
                        </div>
                      </div>
                      <span className='text-xs font-bold uppercase tracking-wide text-[#c5a059]'>
                        {shippingCharge === 0 ? "Complimentary" : formatPrice(shippingCharge)}
                      </span>
                    </div>
                  </section>

                  {showCheckoutWizard && checkoutStep === 1 && (
                    <div className='mt-8 lg:hidden'>
                      <button
                        type='button'
                        className={heritageCta}
                        onClick={() => void goToPaymentStep()}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  )}
                </section>
              )}

              {(!showCheckoutWizard || checkoutStep === 2) && (
                <section className={heritageSectionCard}>
                  <h2 className='mb-6 font-serif text-2xl font-medium text-navy-900 sm:text-3xl'>
                    Payment Method
                  </h2>

                  {existingOrder ? (
                    <div className='border border-[#c5a059]/30 bg-[#fff8eb]/50 p-5 sm:p-6'>
                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='mt-0.5 h-6 w-6 shrink-0 text-[#c5a059]' />
                        <div>
                          <p className='font-semibold text-navy-900'>
                            Complete payment
                          </p>
                          <p className='mt-1 text-sm leading-relaxed text-gray-600'>
                            You&apos;ll finish payment on the next step after
                            placing your order. Secure processing only.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type='button'
                        onClick={() => setCheckoutPaymentMethod("razorpay")}
                        className={cn(
                          "mb-4 w-full border p-5 text-left transition-all duration-300 sm:p-6",
                          checkoutPaymentMethod === "razorpay"
                            ? "border-2 border-navy-900 bg-[#f8f9fa]"
                            : "border-gray-200/70 bg-white hover:border-[#c5a059]/50",
                        )}
                      >
                        <div className='flex items-start gap-4'>
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center",
                              checkoutPaymentMethod === "razorpay"
                                ? "bg-navy-900 text-white"
                                : "border border-gray-200 text-navy-900",
                            )}
                          >
                            <Wallet className='h-5 w-5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='font-semibold text-navy-900'>
                              Pay online
                            </p>
                            <p className='mt-1 text-sm leading-relaxed text-gray-600'>
                              UPI, cards &amp; net banking. No extra charges.
                            </p>
                          </div>
                          <CheckCircle2
                            className={cn(
                              "h-5 w-5 shrink-0",
                              checkoutPaymentMethod === "razorpay"
                                ? "text-[#c5a059]"
                                : "text-gray-300",
                            )}
                          />
                        </div>
                      </button>

                      <button
                        type='button'
                        onClick={() => setCheckoutPaymentMethod("cod")}
                        className={cn(
                          "w-full border p-5 text-left transition-all duration-300 sm:p-6",
                          checkoutPaymentMethod === "cod"
                            ? "border-2 border-navy-900 bg-[#f8f9fa]"
                            : "border-gray-200/70 bg-white hover:border-[#c5a059]/50",
                        )}
                      >
                        <div className='flex items-start gap-4'>
                          <div className='flex h-10 w-10 shrink-0 items-center justify-center bg-[#c5a059] text-white'>
                            <Banknote className='h-5 w-5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='font-semibold text-navy-900'>
                              Cash on delivery (COD)
                            </p>
                            <p className='mt-1 text-sm leading-relaxed text-gray-600'>
                              Pay when your order arrives. A one-time{" "}
                              <span className='font-semibold text-navy-900'>
                                {formatPrice(COD_HANDLING_FEE)} COD fee
                              </span>
                              .
                            </p>
                          </div>
                          <CheckCircle2
                            className={cn(
                              "h-5 w-5 shrink-0",
                              checkoutPaymentMethod === "cod"
                                ? "text-[#c5a059]"
                                : "text-gray-300",
                            )}
                          />
                        </div>
                      </button>
                    </>
                  )}
                  {showCheckoutWizard && checkoutStep === 2 && (
                    <div className='mt-8 flex flex-col gap-3 lg:hidden'>
                      <button
                        type='button'
                        className='h-11 w-full border border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:border-navy-900 hover:text-navy-900'
                        onClick={() => setCheckoutStep(1)}
                      >
                        Back to Shipping
                      </button>
                      <button
                        type='button'
                        className={heritageCta}
                        onClick={() => void goToReviewStep()}
                      >
                        Review Order &amp; Pay
                      </button>
                    </div>
                  )}
                </section>
              )}

              {showCheckoutWizard && checkoutStep === 3 && (
                <section className={cn(heritageSectionCard, "hidden lg:block")}>
                  <CheckoutReviewRecap
                    address={reviewAddressDisplay}
                    paymentMethod={checkoutPaymentMethod}
                    onEditAddress={() => setCheckoutStep(1)}
                    onEditPayment={() => setCheckoutStep(2)}
                  />
                </section>
              )}
            </div>

            <div
              className={cn(
                "min-w-0 lg:col-span-4",
                showCheckoutWizard && checkoutStep < 3 && "order-2 lg:order-none",
              )}
            >
                <div
                  className={cn(
                    heritageSummaryCard,
                    "lg:sticky lg:top-28",
                    showCheckoutWizard &&
                      checkoutStep === 3 &&
                      "flex flex-col border-0 bg-transparent p-0 shadow-none lg:border lg:border-gray-200/70 lg:bg-white lg:p-8 lg:shadow-[0px_20px_40px_rgba(3,22,50,0.04)]",
                  )}
                >
                  {showCheckoutWizard && checkoutStep === 3 && (
                    <>
                      <button
                        type='button'
                        className='mb-5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:text-navy-900 lg:hidden'
                        onClick={() => setCheckoutStep(2)}
                      >
                        ← Back to Payment
                      </button>
                      <CheckoutReviewRecap
                        className='mb-8 border-b border-gray-200/70 pb-8 lg:hidden'
                        address={reviewAddressDisplay}
                        paymentMethod={checkoutPaymentMethod}
                        onEditAddress={() => setCheckoutStep(1)}
                        onEditPayment={() => setCheckoutStep(2)}
                      />
                    </>
                  )}

                  <div
                    className={cn(
                      "mb-6 min-w-0 border-b border-gray-200/70 pb-6",
                      checkoutStep === 3 && "order-2 border-b-0 pb-0 pt-6",
                    )}
                  >
                    <div className='mb-4 flex min-w-0 items-center justify-between gap-2'>
                      <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500'>
                        Promotional Code
                      </p>
                      {eligibleCoupons.length > 2 && (
                        <button
                          type='button'
                          onClick={() => setIsAllCouponsOpen(true)}
                          className='shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#c5a059] hover:text-navy-900'
                        >
                          View all
                        </button>
                      )}
                    </div>

                    {hasAppliedCoupon ? (
                      <div className='min-w-0 space-y-3 border border-[#c5a059]/35 bg-[#fff8eb]/40 p-3 sm:p-4'>
                        <CouponAppliedBanner
                          variant='heritage'
                          code={activeCouponCode}
                          savedAmount={activeCouponDiscount}
                          eligibleCoupons={eligibleCoupons}
                          helperText='The discount is reflected in your order total below.'
                        />
                        <button
                          type='button'
                          className='w-full border border-gray-200 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500 transition-colors hover:border-[#c5a059]/50 hover:bg-white hover:text-navy-900 disabled:opacity-50'
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
                          {couponBusy ? "Removing…" : "Remove Coupon"}
                        </button>
                      </div>
                    ) : (
                      <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch'>
                        <input
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder='Enter coupon code'
                          autoComplete='off'
                          className='h-10 min-w-0 w-full border border-gray-300 bg-white px-3 text-sm focus:border-[#c5a059]/60 focus:outline-none focus:ring-1 focus:ring-[#c5a059]/30'
                        />
                        <button
                          type='button'
                          className='h-10 shrink-0 bg-[#c5a059] px-4 text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#b8924d] disabled:opacity-50 sm:min-w-[5.5rem]'
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
                        </button>
                      </div>
                    )}

                    {isLoadingCoupons ? (
                      <p className='mt-3 text-xs text-gray-500'>
                        Loading available offers…
                      </p>
                    ) : eligibleCoupons.length === 0 ? (
                      <p className='mt-3 text-xs text-gray-500'>
                        No coupons are available for this order.
                      </p>
                    ) : (
                      <div className='mt-3 grid min-w-0 grid-cols-1 gap-2'>
                        {eligibleCoupons.slice(0, 2).map((c) => (
                          <button
                            key={c._id}
                            type='button'
                            disabled={hasAppliedCoupon || couponBusy}
                            title={
                              hasAppliedCoupon
                                ? "Remove your current coupon to use another"
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
                              "min-w-0 border border-[#c5a059]/20 p-3 text-left transition-all",
                              hasAppliedCoupon || couponBusy
                                ? "cursor-not-allowed opacity-50"
                                : "hover:border-[#c5a059]/50 hover:bg-[#fff8eb]/50",
                            )}
                          >
                            <CouponOfferPreview coupon={c} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      checkoutStep === 3 && "order-1 border-t border-gray-200/70 pt-6",
                    )}
                  >
                  <button
                    type='button'
                    className='group mb-4 flex w-full min-w-0 items-center justify-between gap-2 lg:cursor-default'
                    onClick={() => setShowItems(!showItems)}
                  >
                    <h2 className='truncate text-left font-serif text-xl font-medium uppercase tracking-widest text-navy-900'>
                      Order Summary
                    </h2>
                    <span className='text-gray-400 lg:hidden'>
                      {showItems ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </span>
                  </button>
                  <p className='-mt-2 mb-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400'>
                    {checkoutItems.length}{" "}
                    {checkoutItems.length === 1 ? "item" : "items"}
                    {buyNowItem && !existingOrder && (
                      <span className='ml-2 text-[#c5a059]'>· Quick buy</span>
                    )}
                  </p>

                  <div
                    className={cn(
                      "space-y-4 mb-6",
                      showItems ? "block" : "hidden lg:block",
                    )}
                  >
                    {checkoutItems.map((item, lineIndex) => {
                      const row: CheckoutRowDisplay = toCheckoutRowDisplay(
                        item,
                        !!existingOrder,
                      );
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
                      const cartItemId = cartLine?.cartItemId;
                      const buyNowSku =
                        buyNowItem && !existingOrder ?
                          buyNowItem.variant.sku
                        : undefined;
                      const lineBusy = Boolean(
                        (sku && lineBusySku === sku) ||
                        (buyNowSku && lineBusySku === buyNowSku),
                      );
                      const maxLineQty =
                        buyNowItem && !existingOrder ?
                          Math.min(10, Math.max(1, buyNowItem.maxStock ?? 10))
                        : Math.min(10, row.variant.stock ?? 10);
                      const showCartLineControls = Boolean(cartLine && sku);
                      const showBuyNowLineControls = Boolean(
                        buyNowItem && !existingOrder && buyNowSku,
                      );
                      const showRemovableLine =
                        showCartLineControls || showBuyNowLineControls;
                      return (
                        <div
                          key={rowKey}
                          className='flex min-w-0 items-center gap-4 border-b border-gray-100 pb-5 last:border-0 last:pb-0'
                        >
                          <div className='relative h-24 w-20 shrink-0 overflow-hidden bg-gray-100 sm:h-28 sm:w-24'>
                            <Image
                              src={thumb}
                              alt={row.name || "Product"}
                              fill
                              sizes='72px'
                              className='object-cover'
                            />
                            {!cartLine && !buyNowItem && (
                              <span className='absolute bottom-1 right-1 flex h-5 min-w-[1.25rem] items-center justify-center bg-navy-900 px-1 text-[10px] font-bold text-white'>
                                {row.quantity}
                              </span>
                            )}
                          </div>
                          <div className='flex min-w-0 flex-1 flex-col justify-between py-1'>
                            <div>
                              <p className='line-clamp-2 font-serif text-base font-medium leading-snug text-navy-900'>
                                {row.name || "Product"}
                              </p>
                              <p className='mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500'>
                                Qty: {row.quantity}
                                {[row.variant?.size, row.variant?.color]
                                  .filter(Boolean)
                                  .length > 0 &&
                                  ` · ${[row.variant?.size, row.variant?.color].filter(Boolean).join(" · ")}`}
                              </p>
                            </div>
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
                                            <span className='font-semibold text-[#c5a059]'>
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
                                      cartItemId!,
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
                                      cartItemId!,
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
                          <div className='flex shrink-0 flex-col items-end justify-between gap-1 self-stretch'>
                            <p className='font-serif text-base font-medium tabular-nums text-[#c5a059]'>
                              {formatPrice(row.price * row.quantity)}
                            </p>
                            {showRemovableLine && (
                              <button
                                type='button'
                                disabled={lineBusy}
                                onClick={() => {
                                  if (showCartLineControls && sku && cartItemId) {
                                    void removeLine(cartItemId, sku);
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

                  <div className='space-y-3 border-t border-gray-200/70 py-6 text-sm'>
                    <div className='flex justify-between text-gray-600'>
                      <span>Subtotal</span>
                      <span className='tabular-nums text-navy-900'>
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className='flex justify-between text-[#c5a059]'>
                        <span>Discount</span>
                        <span className='font-semibold tabular-nums'>
                          − {formatPrice(discount)}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between gap-3 text-gray-600'>
                      <span className='min-w-0'>Shipping</span>
                      <span
                        className={cn(
                          "shrink-0 text-right text-xs font-bold uppercase tracking-wide",
                          shippingCharge === 0
                            ? "text-[#c5a059]"
                            : "text-navy-900",
                        )}
                      >
                        {shippingCharge === 0
                          ? "Complimentary"
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
                    <div className='flex justify-between border-t border-navy-900/10 pt-4'>
                      <span className='font-serif text-lg font-medium uppercase tracking-tight text-navy-900'>
                        Grand Total
                      </span>
                      <span className='font-serif text-xl font-semibold tabular-nums text-navy-900'>
                        {formatPrice(total)}
                      </span>
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
                  </div>

                  {showCheckoutWizard && checkoutStep === 1 && (
                    <button
                      type='button'
                      className={cn(
                        heritageCta,
                        "mt-6 shadow-[0px_20px_40px_rgba(3,22,50,0.08)]",
                      )}
                      onClick={() => void goToPaymentStep()}
                    >
                      Proceed to Payment
                    </button>
                  )}

                  {showCheckoutWizard && checkoutStep === 2 && (
                    <div className='mt-6 space-y-3'>
                      <button
                        type='button'
                        className='h-11 w-full border border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:border-navy-900 hover:text-navy-900'
                        onClick={() => setCheckoutStep(1)}
                      >
                        Back to Shipping
                      </button>
                      <button
                        type='button'
                        className={cn(
                          heritageCta,
                          "shadow-[0px_20px_40px_rgba(3,22,50,0.08)]",
                        )}
                        onClick={() => void goToReviewStep()}
                      >
                        Review Order &amp; Pay
                      </button>
                    </div>
                  )}

                  <div
                    className={cn(checkoutStep === 3 && "order-3")}
                  >
                  {(!showCheckoutWizard || checkoutStep === 3) && (
                    <>
                      {showCheckoutWizard && (
                        <button
                          type='button'
                          className='mb-3 hidden w-full text-[11px] font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:text-navy-900 lg:block'
                          onClick={() => setCheckoutStep(2)}
                        >
                          ← Back to Payment
                        </button>
                      )}
                      <button
                        type='submit'
                        className={cn(
                          heritageCta,
                          "mt-6 shadow-[0px_20px_40px_rgba(3,22,50,0.08)]",
                        )}
                        disabled={isPlacingOrder}
                      >
                        {isPlacingOrder
                          ? "Placing order…"
                          : existingOrder
                            ? `Confirm & Pay — ${formatPrice(total)}`
                            : checkoutPaymentMethod === "razorpay"
                              ? `Confirm & Pay — ${formatPrice(total)}`
                              : `Confirm & Place Order — ${formatPrice(total)}`}
                      </button>

                      <p className='mt-3 text-center text-[11px] text-gray-400'>
                        By placing this order, you agree to our{" "}
                        <Link
                          href='/terms'
                          className='font-semibold text-[#c5a059] underline-offset-2 hover:underline'
                        >
                          terms
                        </Link>{" "}
                        and{" "}
                        <Link
                          href='/privacy'
                          className='font-semibold text-[#c5a059] underline-offset-2 hover:underline'
                        >
                          privacy policy
                        </Link>
                        .
                      </p>
                    </>
                  )}

                  <div className='mt-8 grid grid-cols-3 gap-2 text-center'>
                    {(
                      [
                        { Icon: Shield, label: "Secure Checkout" },
                        { Icon: Truck, label: "Free Delivery" },
                        { Icon: RotateCcw, label: "Easy Returns" },
                      ] as const
                    ).map(({ Icon, label }) => (
                      <div
                        key={label}
                        className='flex flex-col items-center px-1 py-2'
                      >
                        <Icon className='mx-auto mb-2 h-5 w-5 text-[#c5a059]' />
                        <p className='text-[9px] font-semibold uppercase leading-tight tracking-tight text-gray-500'>
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {offerText && (
                    <p className='mt-4 text-center text-xs leading-relaxed text-gray-500'>
                      {offerText}
                    </p>
                  )}
                  </div>
                </div>
              </div>
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
              <div className='relative max-h-[80vh] w-full min-w-0 max-w-[100vw] overflow-hidden bg-white shadow-2xl sm:max-w-lg'>
                <div className='flex min-w-0 items-center justify-between gap-2 border-b border-gray-100 p-4 sm:p-5'>
                  <div className='min-w-0'>
                    <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400'>
                      Promotional Codes
                    </p>
                    <h3 className='truncate font-serif text-lg font-medium text-navy-900'>
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
                        "w-full min-w-0 border border-gray-200 p-3 text-left transition-all",
                        hasAppliedCoupon || couponBusy
                          ? "cursor-not-allowed opacity-50"
                          : "hover:border-[#c5a059]/50 hover:bg-[#fff8eb]/50",
                      )}
                    >
                      <CouponOfferPreview coupon={coupon} />
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
