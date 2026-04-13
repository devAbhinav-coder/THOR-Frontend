"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  X,
  ArrowRight,
  Truck,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice, cn } from "@/lib/utils";
import { cartLineReactKey } from "@/lib/cartLineKey";
import { couponApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CartItem, Coupon } from "@/types";
import { playCheckoutLaunchAnimation } from "@/lib/checkoutLaunchFx";

const SHIPPING_THRESHOLD = 1499;
const SHIPPING_CHARGE = 99;

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=70";

export default function CartClient() {
  const {
    cart,
    isLoading,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    appliedCouponCode,
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const checkoutBtnRef = useRef<HTMLButtonElement>(null);
  const [isCheckoutLaunching, setIsCheckoutLaunching] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [eligibleCoupons, setEligibleCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isAllCouponsOpen, setIsAllCouponsOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!cart || cart.items.length === 0) return;
    const run = async () => {
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
    run();
  }, [isAuthenticated, cart?.subtotal, cart?.items?.length]);

  const goToCheckout = useCallback(async () => {
    if (isCheckoutLaunching) return;
    setIsCheckoutLaunching(true);
    try {
      await playCheckoutLaunchAnimation(checkoutBtnRef.current);
      router.push("/checkout");
    } finally {
      // If navigation fails / is cancelled, allow retry.
      setTimeout(() => setIsCheckoutLaunching(false), 250);
    }
  }, [isCheckoutLaunching, router]);

  if (!isAuthenticated) {
    return (
      <div className='min-h-[min(70vh,calc(100dvh-14rem))] flex flex-col items-center justify-center px-4 py-10 sm:py-14 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-navy-100/90 via-indigo-50/50 to-white border border-navy-200/60 shadow-sm shadow-navy-900/5'>
        <div className='w-full max-w-md rounded-2xl border border-navy-200/80 bg-white/95 backdrop-blur-sm px-6 py-10 sm:px-8 sm:py-12 text-center shadow-md shadow-navy-900/10'>
          <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900/5 ring-1 ring-navy-200/80'>
            <ShoppingBag className='h-8 w-8 text-navy-700' strokeWidth={1.5} />
          </div>
          <h2 className='text-xl sm:text-2xl font-serif font-bold text-navy-900 mb-2'>
            Please sign in to view your cart
          </h2>
          <p className='text-sm sm:text-base text-navy-700/75 mb-8 leading-relaxed'>
            Create an account or sign in to start shopping
          </p>
          <Button
            asChild
            variant='brand'
            size='lg'
            className='w-full sm:w-auto min-w-[200px]'
          >
            <Link href='/auth/login?redirect=/cart'>Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className='min-h-[min(70vh,calc(100dvh-14rem))] flex flex-col items-center justify-center px-4 py-10 sm:py-14 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-navy-100/90 via-indigo-50/50 to-white border border-navy-200/60 shadow-sm shadow-navy-900/5'>
        <div className='w-full max-w-md rounded-2xl border border-navy-200/80 bg-white/95 backdrop-blur-sm px-6 py-10 sm:px-8 sm:py-12 text-center shadow-md shadow-navy-900/10'>
          <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900/5 ring-1 ring-navy-200/80'>
            <ShoppingBag className='h-8 w-8 text-navy-700' strokeWidth={1.5} />
          </div>
          <h2 className='text-xl sm:text-2xl font-serif font-bold text-navy-900 mb-2'>
            Your cart is empty
          </h2>
          <p className='text-sm sm:text-base text-navy-700/75 mb-8 leading-relaxed'>
            Add some beautiful pieces to get started
          </p>
          <Button
            asChild
            variant='brand'
            size='lg'
            className='w-full sm:w-auto min-w-[200px]'
          >
            <Link href='/shop'>Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const shippingCharge =
    cart.subtotal - cart.discount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const estimatedTotal = cart.subtotal - cart.discount + shippingCharge;
  const freeShippingRemaining =
    SHIPPING_THRESHOLD - (cart.subtotal - cart.discount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponInput.trim().toUpperCase());
      setCouponInput("");
    } catch {
      // error handled in store
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-navy-50/90 via-white to-white border border-navy-100/80 lg:rounded-none lg:border-0 lg:bg-transparent'>
      <div className='flex items-end justify-between gap-4 mb-6'>
        <div>
          <p className='text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold'>
            Cart
          </p>
          <h1 className='text-2xl sm:text-3xl font-serif font-bold text-gray-900'>
            Shopping Bag
          </h1>
        </div>
        <p className='text-sm text-gray-500'>
          {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {freeShippingRemaining > 0 && (
        <div className='bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3'>
          <Truck className='h-4 w-4 text-amber-600 flex-shrink-0' />
          <p className='text-sm text-amber-800'>
            Add <strong>{formatPrice(freeShippingRemaining)}</strong> more to
            get <strong>FREE shipping!</strong>
          </p>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-2xl border border-gray-100 overflow-hidden'>
            <div className='px-5 py-4 border-b border-gray-100 flex items-center justify-between'>
              <h2 className='font-semibold text-gray-900'>Items</h2>
              <Link
                href='/shop'
                className='text-sm font-semibold text-brand-700 hover:text-brand-800'
              >
                Continue shopping
              </Link>
            </div>

            <div className='divide-y divide-gray-100'>
              {cart.items
                .filter((item: CartItem) => item.product)
                .map((item: CartItem) =>
                  (() => {
                    const isCorporateGift = (
                      item.product?.giftOccasions || []
                    ).some(
                      (o) => String(o).trim().toLowerCase() === "corporate",
                    );
                    const minQty =
                      isCorporateGift ?
                        Math.max(item.product?.minOrderQty || 1, 10)
                      : Math.max(item.product?.minOrderQty || 1, 1);
                    const thumb =
                      item.product?.images?.[0]?.url || PLACEHOLDER_IMAGE;
                    const rowKey = cartLineReactKey(item);
                    const productHref =
                      item.product?.slug ?
                        `/shop/${encodeURIComponent(item.product.slug)}`
                      : "#";
                    return (
                      <div
                        key={rowKey}
                        className='flex items-stretch gap-4 p-5'
                      >
                        <Link
                          href={productHref}
                          className='relative h-24 w-20 shrink-0 self-start overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100 sm:h-28 sm:w-24'
                        >
                          <Image
                            key={rowKey}
                            src={thumb}
                            alt={item.product?.name || "Product"}
                            fill
                            sizes='96px'
                            className='object-cover'
                          />
                        </Link>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0 flex-1'>
                              <Link
                                href={productHref}
                                className='font-medium text-gray-900 text-sm hover:text-brand-700 line-clamp-2'
                              >
                                {item.product?.name || "Product"}
                              </Link>
                              <p className='text-xs text-gray-500 mt-1'>
                                {[
                                  item.variant.size &&
                                    `Size ${item.variant.size}`,
                                  item.variant.color && item.variant.color,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              {/* Gifting Custom Fields */}
                              {item.customFieldAnswers &&
                                item.customFieldAnswers.length > 0 && (
                                  <div className='mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
                                    {item.customFieldAnswers.map((ans, i) => {
                                      const isImage =
                                        typeof ans.value === "string" &&
                                        /^https?:\/\//.test(ans.value);
                                      return (
                                        <div
                                          key={i}
                                          className='rounded-md bg-gold-50 border border-gold-100 px-2 py-1.5'
                                        >
                                          <p className='text-[10px] font-semibold text-gold-700'>
                                            {ans.label}
                                          </p>
                                          {isImage ?
                                            <a
                                              href={ans.value}
                                              target='_blank'
                                              rel='noreferrer'
                                              className='mt-1 inline-flex items-center gap-1'
                                            >
                                              <span className='relative h-9 w-9 rounded overflow-hidden border border-gold-200 bg-white'>
                                                <Image
                                                  src={ans.value}
                                                  alt={ans.label}
                                                  fill
                                                  sizes='36px'
                                                  className='object-cover'
                                                />
                                              </span>
                                              <span className='text-[10px] font-semibold text-brand-600'>
                                                View
                                              </span>
                                            </a>
                                          : <p className='text-[10px] font-medium text-gray-700 break-words'>
                                              {ans.value}
                                            </p>
                                          }
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              {minQty > 1 && (
                                <p className='text-[11px] text-amber-700 mt-1'>
                                  Minimum quantity: {minQty}
                                </p>
                              )}
                            </div>
                            <div className='flex shrink-0 flex-col items-end justify-between gap-1 self-stretch'>
                              <div className='text-right'>
                                <p className='font-semibold text-gray-900'>
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                                {item.quantity > 1 && (
                                  <p className='text-xs text-gray-400'>
                                    {formatPrice(item.price)} each
                                  </p>
                                )}
                              </div>
                              <button
                                type='button'
                                onClick={() => removeItem(item.variant.sku)}
                                disabled={isLoading}
                                className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
                                aria-label='Remove item'
                                title='Remove'
                              >
                                <Trash2
                                  className='h-3.5 w-3.5'
                                  strokeWidth={2}
                                />
                              </button>
                            </div>
                          </div>

                          <div className='mt-4'>
                            <div className='inline-flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden'>
                              <button
                                onClick={() =>
                                  item.quantity > minQty ?
                                    updateItem(
                                      item.variant.sku,
                                      item.quantity - 1,
                                    )
                                  : item.quantity === 1 ?
                                    removeItem(item.variant.sku)
                                  : undefined
                                }
                                className='h-9 w-9 grid place-items-center text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50'
                                disabled={isLoading || item.quantity <= minQty}
                                aria-label='Decrease quantity'
                              >
                                <Minus className='h-4 w-4' />
                              </button>
                              <span className='w-10 text-center text-sm font-semibold text-gray-900'>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateItem(
                                    item.variant.sku,
                                    item.quantity + 1,
                                  )
                                }
                                className='h-9 w-9 grid place-items-center text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50'
                                disabled={isLoading}
                                aria-label='Increase quantity'
                              >
                                <Plus className='h-4 w-4' />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })(),
                )}
            </div>
          </div>
        </div>

        <div className='lg:sticky lg:top-24 self-start'>
          <div className='bg-white rounded-2xl border border-gray-100 overflow-hidden'>
            <div className='p-5 border-b border-gray-100'>
              <h2 className='font-semibold text-gray-900'>Summary</h2>
              <p className='text-xs text-gray-500 mt-1'>
                Cash on delivery is available at checkout.
              </p>
            </div>

            <div className='p-5 space-y-4'>
              {/* Coupon */}
              <div className='rounded-2xl border border-gray-100 bg-gray-50/60 p-4 min-w-0'>
                <div className='flex items-center justify-between gap-3 min-w-0'>
                  <p className='text-sm font-semibold text-gray-900'>
                    Promotional code
                  </p>
                  {eligibleCoupons.length > 2 && (
                    <button
                      type='button'
                      onClick={() => setIsAllCouponsOpen(true)}
                      className='text-xs font-semibold text-brand-700 hover:text-brand-800 shrink-0'
                    >
                      View all
                    </button>
                  )}
                </div>

                {cart.discount > 0 ?
                  <div className='mt-3 space-y-3 rounded-xl border border-green-200 bg-green-50 p-3'>
                    <div className='flex items-start gap-2 min-w-0'>
                      <Tag
                        className='h-4 w-4 text-green-700 shrink-0 mt-0.5'
                        aria-hidden
                      />
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-green-900 break-words'>
                          <span className='font-semibold tracking-wide'>
                            {appliedCouponCode || "Coupon"}
                          </span>
                          <span className='text-green-800'>
                            {" "}
                            · You save {formatPrice(cart.discount)}
                          </span>
                        </p>
                        <p className='text-xs text-green-800/75 mt-1'>
                          The discount is included in your total below.
                        </p>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='w-full border-red-200/80 text-red-700 hover:bg-red-50 hover:text-red-800'
                      disabled={couponLoading}
                      onClick={async () => {
                        setCouponLoading(true);
                        try {
                          await removeCoupon();
                        } finally {
                          setCouponLoading(false);
                        }
                      }}
                    >
                      {couponLoading ? "Removing…" : "Remove coupon"}
                    </Button>
                  </div>
                : <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch'>
                    <input
                      type='text'
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      placeholder='Enter coupon code'
                      autoComplete='off'
                      className='min-w-0 w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-500'
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleApplyCoupon()
                      }
                    />
                    <Button
                      variant='brand'
                      size='sm'
                      onClick={handleApplyCoupon}
                      loading={couponLoading}
                      disabled={!couponInput.trim()}
                      className='h-10 px-4 rounded-xl w-full sm:w-auto shrink-0'
                    >
                      Apply
                    </Button>
                  </div>
                }

                {/* Eligible coupons (top 2) */}
                <div className='mt-4'>
                  {isLoadingCoupons ?
                    <p className='text-xs text-gray-500'>
                      Loading available offers…
                    </p>
                  : eligibleCoupons.length === 0 ?
                    <p className='text-xs text-gray-500'>
                      No coupons are available for this cart.
                    </p>
                  : <div className='space-y-2'>
                      {eligibleCoupons.slice(0, 2).map((c) => (
                        <button
                          key={c._id}
                          type='button'
                          title={
                            cart.discount > 0 ?
                              "Remove your current coupon to use another"
                            : undefined
                          }
                          onClick={async () => {
                            try {
                              setCouponLoading(true);
                              await applyCoupon(c.code);
                            } catch {
                              // store handles toast
                            } finally {
                              setCouponLoading(false);
                            }
                          }}
                          className={cn(
                            "w-full min-w-0 text-left p-3 rounded-2xl border border-gray-200 bg-white transition-all",
                            cart.discount > 0 || couponLoading ?
                              "opacity-50 cursor-not-allowed"
                            : "hover:border-brand-300 hover:bg-brand-50",
                          )}
                          disabled={couponLoading || cart.discount > 0}
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <span className='font-mono font-bold text-sm text-brand-700'>
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
              </div>

              {/* Totals */}
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between text-gray-600'>
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className='flex justify-between text-green-700'>
                    <span>Discount</span>
                    <span>- {formatPrice(cart.discount)}</span>
                  </div>
                )}
                <div className='flex justify-between text-gray-600'>
                  <span>Shipping</span>
                  <span
                    className={
                      shippingCharge === 0 ? "text-green-700 font-semibold" : ""
                    }
                  >
                    {shippingCharge === 0 ?
                      "FREE"
                    : formatPrice(shippingCharge)}
                  </span>
                </div>
                <div className='pt-3 mt-3 border-t border-gray-100 flex items-center justify-between'>
                  <span className='font-semibold text-gray-900'>Total</span>
                  <span className='font-bold text-lg text-gray-900'>
                    {formatPrice(estimatedTotal)}
                  </span>
                </div>
              </div>

              <Button
                ref={checkoutBtnRef}
                type='button'
                variant='brand'
                size='xl'
                className='w-full rounded-xl'
                disabled={isCheckoutLaunching}
                onClick={() => void goToCheckout()}
              >
                {isCheckoutLaunching ?
                  <>
                    <span className='h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin' />
                    Opening checkout…
                  </>
                : <>
                    Proceed to Checkout <ArrowRight className='h-4 w-4' />
                  </>
                }
              </Button>

              <p className='text-[11px] text-gray-400 leading-relaxed'>
                By continuing, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* See all coupons modal */}
      {isAllCouponsOpen && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60'>
          <div
            className='absolute inset-0'
            onClick={() => setIsAllCouponsOpen(false)}
          />
          <div className='relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden'>
            <div className='p-4 border-b border-gray-100 flex items-center justify-between min-w-0 gap-2'>
              <div className='min-w-0'>
                <p className='text-xs uppercase tracking-widest text-gray-400 font-semibold'>
                  Promotional codes
                </p>
                <h3 className='text-lg font-bold text-gray-900 truncate'>
                  Available for your cart
                </h3>
              </div>
              <button
                onClick={() => setIsAllCouponsOpen(false)}
                className='h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center'
                aria-label='Close'
              >
                <X className='h-4 w-4 text-gray-600' />
              </button>
            </div>
            <div className='p-4 overflow-y-auto overflow-x-hidden space-y-2 min-w-0'>
              {eligibleCoupons.map((c) => (
                <button
                  key={c._id}
                  type='button'
                  onClick={async () => {
                    try {
                      setCouponLoading(true);
                      await applyCoupon(c.code);
                      setIsAllCouponsOpen(false);
                    } catch {
                      // store handles toast
                    } finally {
                      setCouponLoading(false);
                    }
                  }}
                  className={cn(
                    "w-full min-w-0 text-left p-3 rounded-xl border border-gray-200 transition-all",
                    cart.discount > 0 || couponLoading ?
                      "opacity-50 cursor-not-allowed"
                    : "hover:border-brand-300 hover:bg-brand-50",
                  )}
                  disabled={couponLoading || cart.discount > 0}
                >
                  <div className='flex items-center justify-between gap-2 min-w-0'>
                    <span className='font-mono font-bold text-sm text-brand-700 truncate'>
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
                  {c.description && (
                    <p className='text-xs text-gray-400 mt-1 line-clamp-2'>
                      {c.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
