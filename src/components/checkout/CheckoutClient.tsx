"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  Tag,
  Truck,
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { couponApi, orderApi } from "@/lib/api";
import { formatPrice, cn, loadRazorpayScript } from "@/lib/utils";
import { cartLineReactKey } from "@/lib/cartLineKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coupon, Order } from "@/types";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

const addressSchema = z.object({
  name: z.string().min(2, "Full name is required").max(80, "Name is too long"),
  phone: z
    .string()
    .min(1, "Mobile number is required")
    .refine((val) => {
      const raw = val.replace(/\s+/g, "");
      const pn = parsePhoneNumberFromString(raw, "IN");
      return !!pn && pn.isValid() && pn.country === "IN";
    }, "Enter a valid Indian mobile number"),
  street: z.string().min(5, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode"),
  country: z.string().default("India"),
});

type AddressForm = z.infer<typeof addressSchema>;

const SHIPPING_THRESHOLD = 1000;
const SHIPPING_CHARGE = 100;
const TAX_RATE = 0;

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
  const [showItems, setShowItems] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [eligibleCoupons, setEligibleCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isAllCouponsOpen, setIsAllCouponsOpen] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  
  // Custom Order support
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [isOrderLoading, setIsOrderLoading] = useState(!!orderId);

  const { cart, fetchCart, applyCoupon, removeCoupon, resetCart, appliedCouponCode } =
    useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "India" },
  });

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
        } catch (err: any) {
          toast.error(err?.message || "Failed to load order");
          router.replace("/dashboard/gifting");
        } finally {
          setIsOrderLoading(false);
        }
      };
      fetchOrder();
    } else {
      fetchCart().catch(() => {});
    }
  }, [isAuthenticated, fetchCart, orderId, router, setValue]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!cart || cart.items.length === 0) return;
    const fetchEligibleCoupons = async () => {
      setIsLoadingCoupons(true);
      try {
        const res = await couponApi.getEligible(cart.subtotal);
        setEligibleCoupons(res.data.coupons || []);
      } catch {
        setEligibleCoupons([]);
      } finally {
        setIsLoadingCoupons(false);
      }
    };
    fetchEligibleCoupons();
  }, [cart?.subtotal, cart?.items?.length, isAuthenticated]);

  const paymentMethod = existingOrder ? "razorpay" : ("cod" as const);

  const subtotal = existingOrder ? existingOrder.subtotal : (cart?.subtotal || 0);
  const discount = existingOrder ? existingOrder.discount : (cart?.discount || 0);
  const subtotalAfterDiscount = subtotal - discount;
  const shippingCharge = existingOrder ? existingOrder.shippingCharge : (subtotalAfterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE);
  const tax = existingOrder ? existingOrder.tax : Math.round(subtotalAfterDiscount * TAX_RATE * 100) / 100;
  const total = existingOrder ? existingOrder.total : (subtotalAfterDiscount + shippingCharge + tax);
  const hasAppliedCoupon = existingOrder ? !!existingOrder.coupon : !!cart?.discount;

  const offerText = useMemo(() => {
    if (!cart) return "";
    if (subtotalAfterDiscount >= SHIPPING_THRESHOLD)
      return "You unlocked FREE shipping!";
    return `Add ${formatPrice(SHIPPING_THRESHOLD - subtotalAfterDiscount)} more for FREE shipping`;
  }, [cart, subtotalAfterDiscount]);

  if (!isAuthenticated || isOrderLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <Loader2 className="h-10 w-10 text-brand-500 animate-spin mx-auto mb-4" />
      <p className="text-gray-500">Preparing checkout...</p>
    </div>
  );

  if (!existingOrder && (!cart || cart.items.length === 0)) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-16 text-center'>
        <h2 className='text-2xl font-bold mb-4'>Your cart is empty</h2>
        <Button asChild variant='brand'>
          <Link href='/shop'>Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const loadAddress = (addressId: string) => {
    const addr = user?.addresses.find((a) => a._id === addressId);
    if (addr) {
      setValue("name", addr.name || user?.name || "");
      setValue("phone", addr.phone || user?.phone || "");
      setValue("street", addr.street);
      setValue("city", addr.city);
      setValue("state", addr.state);
      setValue("pincode", addr.pincode);
      setSelectedAddressId(addressId);
    }
  };

  const onSubmit = async (addressData: AddressForm) => {
    setIsPlacingOrder(true);
    try {
      const normalizedPhone =
        parsePhoneNumberFromString(addressData.phone.replace(/\s+/g, ""), "IN")?.number ||
        addressData.phone;

      if (existingOrder) {
        // 1. Prepare payment
        const prepRes = await orderApi.preparePayment(existingOrder._id);
        const { razorpayOrder } = prepRes.data;

        // 2. Load script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

        // 3. Open Razorpay
        const options = {
          key: razorpayOrder.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "The House of Rani",
          description: `Order ${existingOrder.orderNumber}`,
          order_id: razorpayOrder.id,
          handler: async (response: any) => {
            try {
              const verifyRes = await orderApi.verifyPayment({
                orderId: existingOrder._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              toast.success("Payment successful!");
              router.push(`/dashboard/orders/${verifyRes.data.order._id}`);
            } catch (err: any) {
              toast.error(err?.message || "Payment verification failed");
            }
          },
          prefill: {
            name: addressData.name,
            email: user?.email,
            contact: normalizedPhone,
          },
          theme: { color: "#e8604c" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // COD logic (existing)
        const idempotencyKey =
          typeof crypto !== "undefined" && crypto.randomUUID ?
            crypto.randomUUID()
          : `k${Date.now()}_${Math.floor(Math.random() * 1e12)}`;
        
        const res = await orderApi.create(
          {
            shippingAddress: { ...addressData, phone: normalizedPhone },
            paymentMethod,
          },
          { idempotencyKey }
        );
        const { order } = res.data;
        resetCart();
        toast.success("Order placed successfully!");
        router.push(`/dashboard/orders/${order._id}`);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to process order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className='w-full min-w-0 overflow-x-hidden'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 box-border min-w-0'>
        <h1 className='text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2'>
          Checkout
        </h1>
        <p className='text-sm text-gray-500 mb-8'>
          Secure checkout. {existingOrder ? "Online payment via Razorpay." : "Cash on delivery is available for your order."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className='min-w-0'>
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 min-w-0'>
            <div className='lg:col-span-3 space-y-6 min-w-0'>
              <div className='bg-white rounded-xl p-4 sm:p-6 border border-gray-100 min-w-0'>
                <div className='flex items-center gap-2 mb-5'>
                  <MapPin className='h-5 w-5 text-brand-600' />
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Shipping Address
                  </h2>
                </div>

                {/* Account email (read-only) */}
                <div className='mb-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3'>
                  <p className='text-[11px] uppercase tracking-widest text-gray-400 font-semibold'>
                    Email
                  </p>
                  <p className='text-sm font-semibold text-gray-900 mt-0.5'>
                    {user?.email || "—"}
                  </p>
                </div>

                {user?.addresses && user.addresses.length > 0 && (
                  <div className='mb-5'>
                    <p className='text-sm font-medium text-gray-700 mb-3'>
                      Saved Addresses
                    </p>
                    <div className='space-y-2'>
                      {(user.addresses || []).map((addr) => (
                        <label
                          key={addr._id}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            selectedAddressId === addr._id ?
                              "border-brand-500 bg-brand-50"
                            : "border-gray-200 hover:border-brand-300"
                          }`}
                        >
                          <input
                            type='radio'
                            name='savedAddress'
                            value={addr._id}
                            checked={selectedAddressId === addr._id}
                            onChange={() => loadAddress(addr._id!)}
                            className='mt-0.5'
                          />
                          <div className='text-sm'>
                            <p className='font-medium text-gray-900'>
                              {addr.label}
                            </p>
                            <p className='text-gray-500'>
                              {addr.name} · {addr.phone}
                            </p>
                            <p className='text-gray-600'>
                              {addr.street}, {addr.city}, {addr.state} —{" "}
                              {addr.pincode}
                            </p>
                          </div>
                        </label>
                      ))}
                      <button
                        type='button'
                        onClick={() => setSelectedAddressId("")}
                        className='text-sm text-brand-600 hover:text-brand-700 font-medium'
                      >
                        + Use a different address
                      </button>
                    </div>
                  </div>
                )}

                {/* Name + Phone */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                  <Input
                    {...register("name")}
                    label='Full Name'
                    placeholder='e.g. Rani Sharma'
                    error={errors.name?.message}
                  />
                  <Input
                    {...register("phone")}
                    label='Mobile Number'
                    placeholder='e.g. 9876543210'
                    error={errors.phone?.message}
                    inputMode='tel'
                  />
                </div>

                <div className='grid grid-cols-1 gap-4'>
                  <Input
                    {...register("street")}
                    label='Street Address'
                    placeholder='House no., Street name, Area'
                    error={errors.street?.message}
                  />
                  <div className='grid grid-cols-2 gap-4'>
                    <Input
                      {...register("city")}
                      label='City'
                      placeholder='City'
                      error={errors.city?.message}
                    />
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        State
                      </label>
                      <select
                        {...register("state")}
                        className='w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                      >
                        <option value=''>Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className='text-xs text-red-600 mt-1'>
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Input
                    {...register("pincode")}
                    label='Pincode'
                    placeholder='6-digit pincode'
                    maxLength={6}
                    error={errors.pincode?.message}
                  />
                </div>
              </div>

              <div className='bg-white rounded-xl p-4 sm:p-6 border border-gray-100 min-w-0'>
                <div className='flex items-center gap-2 mb-3'>
                  <Truck className='h-5 w-5 text-brand-600' />
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Payment
                  </h2>
                </div>
                <div className='p-4 rounded-xl border-2 border-brand-500 bg-brand-50'>
                  <div className='flex items-start gap-3'>
                    {existingOrder ? (
                       <CheckCircle2 className='h-5 w-5 text-brand-600 mt-0.5' />
                    ) : (
                       <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                    )}
                    <div>
                      <p className='font-medium text-gray-900'>
                        {existingOrder ? "Online Payment (Razorpay)" : "Cash on Delivery"}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {existingOrder ? "Pay securely via cards, UPI, or netbanking." : "Pay when your order arrives at your doorstep."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='lg:col-span-2 min-w-0'>
              <div className='bg-white rounded-xl p-4 sm:p-6 border border-gray-100 sticky top-20 min-w-0 max-w-full'>
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
                        <Tag className='h-4 w-4 text-green-600 shrink-0 mt-0.5' aria-hidden />
                        <div className='min-w-0 flex-1'>
                          <p className='text-sm font-medium text-green-900 break-words'>
                            <span className='font-semibold tracking-wide'>{appliedCouponCode || "Coupon"}</span>
                            <span className='text-green-800'> · You save {formatPrice(cart?.discount || 0)}</span>
                          </p>
                          <p className='text-xs text-green-800/75 mt-1'>
                            The discount is reflected in your order total below.
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
                            await removeCoupon();
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
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder='Enter coupon code'
                        autoComplete='off'
                        className='min-w-0 w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                      <Button
                        type='button'
                        variant='brand'
                        className='w-full sm:w-auto shrink-0 sm:min-w-[5.5rem]'
                        disabled={couponBusy || !couponCode.trim()}
                        onClick={async () => {
                          if (!couponCode.trim()) return;
                          setCouponBusy(true);
                          try {
                            await applyCoupon(couponCode.trim());
                            setCouponCode("");
                          } catch {
                            // toast from store
                          } finally {
                            setCouponBusy(false);
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  }

                  {isLoadingCoupons ? (
                    <div className='text-sm text-gray-500 mt-3'>Loading available offers…</div>
                  ) : eligibleCoupons.length === 0 ? (
                    <div className='text-sm text-gray-500 mt-3'>No coupons are available for this cart.</div>
                  ) : (
                    <div className='grid grid-cols-1 gap-2 mt-3 min-w-0'>
                      {eligibleCoupons.slice(0, 2).map((c) => (
                        <button
                          key={c._id}
                          type='button'
                          disabled={hasAppliedCoupon || couponBusy}
                          title={hasAppliedCoupon ? "Remove your current coupon to use another" : undefined}
                          onClick={async () => {
                            try {
                              await applyCoupon(c.code);
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
                            <span className='font-mono font-bold text-sm text-brand-700 truncate min-w-0'>{c.code}</span>
                            <span className='text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase'>
                              {c.eligibilityType === 'first_order'
                                ? 'First Order'
                                : c.eligibilityType === 'returning'
                                  ? 'Returning'
                                  : 'All Users'}
                            </span>
                          </div>
                          <p className='text-xs text-gray-500 mt-1'>
                            {c.discountType === 'percentage'
                              ? `${c.discountValue}% off`
                              : `${formatPrice(c.discountValue)} off`}
                            {c.minOrderAmount ? ` · Min ${formatPrice(c.minOrderAmount)}` : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type='button'
                  className='flex items-center justify-between w-full mb-4 lg:cursor-default min-w-0 gap-2'
                  onClick={() => setShowItems(!showItems)}
                >
                  <div className='flex items-center gap-2 min-w-0'>
                    <Package className='h-5 w-5 text-brand-600 shrink-0' />
                    <h2 className='text-lg font-semibold text-gray-900 truncate text-left'>
                      Order Items ({existingOrder ? existingOrder.items.length : (cart?.items?.length || 0)})
                    </h2>
                  </div>
                  <span className='lg:hidden'>
                    {showItems ?
                      <ChevronUp className='h-4 w-4' />
                    : <ChevronDown className='h-4 w-4' />}
                  </span>
                </button>

                <div
                  className={`space-y-3 mb-5 ${showItems ? "block" : "hidden lg:block"}`}
                >
                  {(existingOrder ? existingOrder.items : (cart?.items || [])).map((item: any) => {
                    const rowKey = cartLineReactKey({
                      product: item.product,
                      variant: item.variant,
                      customFieldAnswers: item.customFieldAnswers,
                    });
                    const thumb =
                      (existingOrder ? item.image : item.product?.images?.[0]?.url) ||
                      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=70";
                    return (
                    <div key={rowKey} className='flex gap-3 min-w-0'>
                      <div className='relative w-14 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0'>
                        <Image
                          key={rowKey}
                          src={thumb}
                          alt={item.name || "Product"}
                          fill
                          sizes='56px'
                          className='object-cover'
                        />
                        <span className='absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                          {item.quantity}
                        </span>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 line-clamp-2'>
                          {item.name || "Product"}
                        </p>
                        <p className='text-xs text-gray-500 mt-0.5'>
                          {existingOrder ? 
                             [item.variant?.size, item.variant?.color].filter(Boolean).join(" · ") :
                             [item.variant.size, item.variant.color].filter(Boolean).join(" · ")
                          }
                        </p>
                        {item.customFieldAnswers?.length > 0 && (
                          <div className='mt-1.5 grid grid-cols-1 gap-1'>
                            {(item.customFieldAnswers || []).map((ans: { label: string; value: string }, i: number) => {
                              const isImage = typeof ans.value === "string" && /^https?:\/\//.test(ans.value);
                              return (
                                <div key={i} className='inline-flex items-center gap-2 text-[10px] bg-gold-50 border border-gold-100 rounded-md px-2 py-1'>
                                  <span className='font-semibold text-gold-700'>{ans.label}:</span>
                                  {isImage ? (
                                    <a href={ans.value} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1'>
                                      <span className='relative h-7 w-7 rounded overflow-hidden border border-gold-200 bg-white'>
                                        <Image src={ans.value} alt={ans.label} fill sizes='28px' className='object-cover' />
                                      </span>
                                      <span className='font-semibold text-brand-600'>View</span>
                                    </a>
                                  ) : (
                                    <span className='font-medium text-gray-700 break-words'>{ans.value}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <p className='text-sm font-semibold text-gray-900 flex-shrink-0 tabular-nums'>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  );
                  })}
                </div>

                <div className='border-t border-gray-100 pt-4 space-y-2 text-sm'>
                  <div className='flex justify-between text-gray-600'>
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Discount</span>
                      <span>- {formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-gray-600'>
                    <span>Shipping</span>
                    <span
                      className={shippingCharge === 0 ? "text-green-600" : ""}
                    >
                      {shippingCharge === 0 ?
                        "FREE"
                      : formatPrice(shippingCharge)}
                    </span>
                  </div>
                  <div className='flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100'>
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  type='submit'
                  variant='brand'
                  size='xl'
                  className='w-full mt-5 text-center whitespace-normal leading-snug px-3 max-w-full'
                  loading={isPlacingOrder}
                >
                  {existingOrder ? `Pay Now — ${formatPrice(total)}` : `Place Order — ${formatPrice(total)}`}
                </Button>

                <p className='text-xs text-gray-400 text-center mt-3'>
                  {offerText}
                </p>
                <p className='text-xs text-gray-400 text-center mt-1'>
                  By placing this order, you agree to our terms and conditions.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* See all coupons modal (checkout) */}
        {isAllCouponsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 overflow-x-hidden">
            <div className="absolute inset-0" onClick={() => setIsAllCouponsOpen(false)} />
            <div className="relative w-full max-w-[100vw] sm:max-w-lg min-w-0 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between min-w-0 gap-2">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Promotional codes</p>
                  <h3 className="text-lg font-bold text-gray-900 truncate">Available for your order</h3>
                </div>
                <button
                  onClick={() => setIsAllCouponsOpen(false)}
                  className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  aria-label="Close"
                >
                  <span className="text-gray-600 text-lg leading-none">×</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto overflow-x-hidden space-y-2 min-w-0">
                {eligibleCoupons.map((coupon) => (
                  <button
                    key={coupon._id}
                    type="button"
                    disabled={hasAppliedCoupon || couponBusy}
                    onClick={async () => {
                      try {
                        await applyCoupon(coupon.code);
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
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="font-mono font-bold text-sm text-brand-700 truncate">{coupon.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                        {coupon.eligibilityType === 'first_order'
                          ? 'First Order'
                          : coupon.eligibilityType === 'returning'
                            ? 'Returning'
                            : 'All Users'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% off`
                        : `${formatPrice(coupon.discountValue)} off`}
                      {coupon.minOrderAmount ? ` · Min ${formatPrice(coupon.minOrderAmount)}` : ''}
                    </p>
                    {coupon.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{coupon.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
