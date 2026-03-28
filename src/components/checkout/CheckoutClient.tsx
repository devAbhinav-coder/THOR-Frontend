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
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { couponApi, orderApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartItem, Coupon } from "@/types";
import toast from "react-hot-toast";

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
    fetchCart().catch(() => {});
  }, [isAuthenticated, fetchCart]);

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

  const paymentMethod = "cod" as const;

  const subtotalAfterDiscount = cart ? cart.subtotal - cart.discount : 0;
  const shippingCharge =
    subtotalAfterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const tax = Math.round(subtotalAfterDiscount * TAX_RATE * 100) / 100;
  const total = subtotalAfterDiscount + shippingCharge + tax;
  const hasAppliedCoupon = !!cart?.discount;

  const offerText = useMemo(() => {
    if (!cart) return "";
    if (subtotalAfterDiscount >= SHIPPING_THRESHOLD)
      return "You unlocked FREE shipping!";
    return `Add ${formatPrice(SHIPPING_THRESHOLD - subtotalAfterDiscount)} more for FREE shipping`;
  }, [cart, subtotalAfterDiscount]);

  if (!isAuthenticated) return null;

  if (!cart || cart.items.length === 0) {
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
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID ?
        crypto.randomUUID()
      : `k${Date.now()}_${Math.floor(Math.random() * 1e12)}`;
    try {
      const normalizedPhone =
        parsePhoneNumberFromString(addressData.phone.replace(/\s+/g, ""), "IN")?.number ||
        addressData.phone;
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
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div>
      
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2'>
          Checkout
        </h1>
        <p className='text-sm text-gray-500 mb-8'>
          Secure, fast and simple. Cash on Delivery available.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
            <div className='lg:col-span-3 space-y-6'>
              <div className='bg-white rounded-xl p-6 border border-gray-100'>
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
                      {user.addresses.map((addr) => (
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

              <div className='bg-white rounded-xl p-6 border border-gray-100'>
                <div className='flex items-center gap-2 mb-3'>
                  <Truck className='h-5 w-5 text-brand-600' />
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Payment
                  </h2>
                </div>
                <div className='p-4 rounded-xl border-2 border-brand-500 bg-brand-50'>
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                    <div>
                      <p className='font-medium text-gray-900'>
                        Cash on Delivery
                      </p>
                      <p className='text-sm text-gray-500'>
                        Pay when your order arrives at your doorstep.
                      </p>
                      <p className='text-xs text-gray-400 mt-1'>
                        Online payments will be added later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='lg:col-span-2'>
              <div className='bg-white rounded-xl p-6 border border-gray-100 sticky top-20'>
                {/* Coupons (shown above order items) */}
                <div className='mb-5 pb-5 border-b border-gray-100'>
                  <div className='flex items-center justify-between gap-3 mb-3'>
                    <div className='flex items-center gap-2'>
                      <BadgePercent className='h-5 w-5 text-brand-600' />
                      <h2 className='text-lg font-semibold text-gray-900'>
                        Coupons
                      </h2>
                    </div>
                    {eligibleCoupons.length > 2 && (
                      <button
                        type='button'
                        onClick={() => setIsAllCouponsOpen(true)}
                        className='text-sm font-semibold text-brand-600 hover:text-brand-700'
                      >
                        See all
                      </button>
                    )}
                  </div>

                  <div className='flex gap-2'>
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder='Coupon code'
                      className='flex-1 h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={async () => {
                        if (!couponCode.trim()) return;
                        try {
                          await applyCoupon(couponCode.trim());
                          setCouponCode('');
                        } catch {
                          // toast from store
                        }
                      }}
                    >
                      Apply
                    </Button>
                    {hasAppliedCoupon && (
                      <Button type='button' variant='ghost' onClick={removeCoupon}>
                        Remove
                      </Button>
                    )}
                  </div>

                  {hasAppliedCoupon && (
                    <div className='mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2'>
                      <div className='flex items-center gap-2'>
                        <Tag className='h-4 w-4 text-green-600' />
                        <div>
                          <p className='text-sm font-semibold text-green-800'>
                            Coupon applied{appliedCouponCode ? `: ${appliedCouponCode}` : ""} · Saved {formatPrice(cart.discount)}
                          </p>
                          <p className='text-xs text-green-700/80'>
                            Your discount is already included in the total.
                          </p>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={removeCoupon}
                        className='h-8 w-8 rounded-lg bg-white/60 hover:bg-white flex items-center justify-center text-green-700'
                        aria-label='Remove coupon'
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {isLoadingCoupons ? (
                    <div className='text-sm text-gray-400 mt-3'>Loading coupons...</div>
                  ) : eligibleCoupons.length === 0 ? (
                    <div className='text-sm text-gray-500 mt-3'>No eligible coupons right now.</div>
                  ) : (
                    <div className='grid grid-cols-1 gap-2 mt-3'>
                      {eligibleCoupons.slice(0, 2).map((c) => (
                        <button
                          key={c._id}
                          type='button'
                          onClick={async () => {
                            try {
                              await applyCoupon(c.code);
                            } catch {
                              // store handles toast
                            }
                          }}
                          className='text-left p-3 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all'
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <span className='font-mono font-bold text-sm text-brand-700'>{c.code}</span>
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
                  className='flex items-center justify-between w-full mb-4 lg:cursor-default'
                  onClick={() => setShowItems(!showItems)}
                >
                  <div className='flex items-center gap-2'>
                    <Package className='h-5 w-5 text-brand-600' />
                    <h2 className='text-lg font-semibold text-gray-900'>
                      Order Items ({cart.items.length})
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
                  {cart.items.map((item: CartItem) => (
                    <div key={item.variant.sku} className='flex gap-3'>
                      <div className='relative w-14 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0'>
                        <Image
                          src={
                            item.product?.images?.[0]?.url ||
                            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=70"
                          }
                          alt={item.product?.name || "Product"}
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
                          {item.product?.name || "Product"}
                        </p>
                        <p className='text-xs text-gray-500 mt-0.5'>
                          {[item.variant.size, item.variant.color]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <p className='text-sm font-semibold text-gray-900 flex-shrink-0'>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className='border-t border-gray-100 pt-4 space-y-2 text-sm'>
                  <div className='flex justify-between text-gray-600'>
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Discount</span>
                      <span>- {formatPrice(cart.discount)}</span>
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
                  className='w-full mt-5'
                  loading={isPlacingOrder}
                >
                  Place Order — {formatPrice(total)}
                </Button>

                <p className='text-xs text-gray-400 text-center mt-3'>
                  {offerText}
                </p>
                <p className='text-xs text-gray-400 text-center mt-1'>
                  By placing an order, you agree to our Terms & Conditions
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* See all coupons modal (checkout) */}
        {isAllCouponsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
            <div className="absolute inset-0" onClick={() => setIsAllCouponsOpen(false)} />
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Coupons</p>
                  <h3 className="text-lg font-bold text-gray-900">All eligible coupons</h3>
                </div>
                <button
                  onClick={() => setIsAllCouponsOpen(false)}
                  className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  aria-label="Close"
                >
                  <span className="text-gray-600 text-lg leading-none">×</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {eligibleCoupons.map((coupon) => (
                  <button
                    key={coupon._id}
                    type="button"
                    onClick={async () => {
                      try {
                        await applyCoupon(coupon.code);
                        setIsAllCouponsOpen(false);
                      } catch {
                        // store handles toast
                      }
                    }}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-brand-700">{coupon.code}</span>
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
