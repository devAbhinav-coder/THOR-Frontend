"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingBag,
  X,
  Truck,
  Undo2,
  Heart,
  Star,
  BadgeCheck,
  Shield,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { formatPrice, cn } from "@/lib/utils";
import { couponApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CartItem, Coupon } from "@/types";
import { CouponAppliedBanner } from "@/components/coupons/CouponAppliedBanner";
import { CouponOfferPreview } from "@/components/coupons/CouponOfferPreview";
import CouponStrip from "@/components/coupons/CouponStrip";
import { playCheckoutLaunchAnimation } from "@/lib/checkoutLaunchFx";
import shoppingCartGif from "@/assets/shopping-cart.gif";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";

const SHIPPING_THRESHOLD = 1099;
const SHIPPING_CHARGE = 99;
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=70";

function isItemOutOfStock(item: CartItem): boolean {
  return !item.isActive || item.variant.stock === 0;
}

function EmptyStateShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[min(70vh,calc(100dvh-14rem))] flex-col items-center justify-center bg-[#f8f9fa] px-4 py-12 sm:py-16">
      <div className="w-full max-w-md border border-gray-200/80 bg-white px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-[#c5a059]/30 bg-[#f8f9fa]">
          <ShoppingBag
            className="h-7 w-7 text-[#c5a059]"
            strokeWidth={1.25}
          />
        </div>
        <h1 className="mb-3 font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
          {title}
        </h1>
        <div className="gold-divider mx-auto mb-5 w-16" aria-hidden />
        <p className="mb-8 text-sm leading-relaxed text-gray-600 sm:text-base">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}

export default function CartClient() {
  const {
    cart,
    isLoading,
    fetchCart,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    appliedCouponCode,
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const router = useRouter();
  const checkoutBtnRef = useRef<HTMLButtonElement>(null);
  const [isCheckoutLaunching, setIsCheckoutLaunching] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [eligibleCoupons, setEligibleCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isAllCouponsOpen, setIsAllCouponsOpen] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchCart();
  }, [isAuthenticated, fetchCart]);

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
  }, [
    isAuthenticated,
    cart?.subtotal,
    cart?.items
      ?.map((i) => `${i.product}:${i.quantity}:${i.price}`)
      .join("|"),
  ]);

  const goToCheckout = useCallback(async () => {
    if (isCheckoutLaunching) return;
    setIsCheckoutLaunching(true);
    try {
      await playCheckoutLaunchAnimation(checkoutBtnRef.current, {
        gifSrc: shoppingCartGif.src,
      });
      router.push("/checkout");
    } finally {
      setTimeout(() => setIsCheckoutLaunching(false), 250);
    }
  }, [isCheckoutLaunching, router]);

  const unavailableItemSkus = useMemo(() => {
    const skus = new Set<string>();
    if (!cart?.items?.length) return skus;
    for (const item of cart.items) {
      if (isItemOutOfStock(item)) {
        skus.add(item.variant.sku);
      }
    }
    return skus;
  }, [cart?.items]);
  const hasUnavailableItems = unavailableItemSkus.size > 0;

  const handleSaveForLater = async (item: CartItem) => {
    if (savingItemId) return;
    setSavingItemId(item.cartItemId);
    try {
      if (!isInWishlist(item.product)) {
        await toggleWishlist(item.product);
      }
      await removeItem(item.cartItemId);
    } finally {
      setSavingItemId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <EmptyStateShell
        title="Shopping Bag"
        description="Please sign in to review your selected pieces of heritage craftsmanship."
      >
        <Button
          asChild
          variant="brand"
          size="lg"
          className="min-w-[220px] uppercase tracking-[0.14em]"
        >
          <Link href={loginUrlWithRedirect("/cart")} scroll={false}>
            Sign In
          </Link>
        </Button>
      </EmptyStateShell>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyStateShell
        title="Shopping Bag"
        description="Your bag is empty. Discover artisanal sarees and ethnic wear curated for you."
      >
        <Link
          href="/shop"
          className="inline-block border-b border-navy-900 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900 transition-colors hover:border-[#c5a059] hover:text-[#c5a059]"
        >
          Explore Collections
        </Link>
      </EmptyStateShell>
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
    <div className="min-h-screen bg-[#f8f9fa] pb-32 pt-8 sm:pt-10 sm:pb-36 lg:pb-16 lg:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 sm:mb-12 lg:mb-14">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
            Shopping Bag
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Review your selected pieces of heritage craftsmanship.
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
          </p>
        </header>

        <div className="mb-8">
          <CouponStrip title="Available coupons" subtitle="Copy a code, then apply below" />
        </div>

        {freeShippingRemaining > 0 && (
          <div className="mb-8 flex items-center gap-3 border border-[#c5a059]/30 bg-[#fff8eb] px-4 py-3 sm:px-5">
            <Truck className="h-4 w-4 shrink-0 text-[#c5a059]" />
            <p className="text-sm text-navy-900/80">
              Add <strong>{formatPrice(freeShippingRemaining)}</strong> more for
              complimentary shipping.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            {hasUnavailableItems && (
              <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Some items are sold out. Remove or save them for later before
                  checkout.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-10 sm:gap-12">
              {cart.items
                .filter((item: CartItem) => item.product)
                .map((item: CartItem) => {
                  const isOutOfStock = isItemOutOfStock(item);
                  const exceedsCurrentStock =
                    item.variant.stock !== undefined &&
                    item.quantity >= item.variant.stock;
                  const isUnavailable =
                    unavailableItemSkus.has(item.variant.sku) || isOutOfStock;
                  const minQty = 1;
                  const thumb = item.productImage || PLACEHOLDER_IMAGE;
                  const rowKey = item.cartItemId || item.variant.sku;
                  const productHref = item.productSlug
                    ? `/shop/${encodeURIComponent(item.productSlug)}`
                    : "#";
                  const variantLine = [
                    item.variant.size && `Size ${item.variant.size}`,
                    item.variant.color && item.variant.color,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <article
                      key={rowKey}
                      className={cn(
                        "group grid grid-cols-3 gap-4 border-b border-gray-200/60 pb-10 sm:grid-cols-4 sm:gap-8 sm:pb-12",
                        isOutOfStock && "opacity-90",
                      )}
                    >
                      <Link
                        href={productHref}
                        className="relative col-span-1 aspect-[3/4] overflow-hidden bg-gray-100"
                      >
                        <Image
                          key={rowKey}
                          src={thumb}
                          alt={item.productName || "Product"}
                          fill
                          sizes="(max-width: 640px) 25vw, 200px"
                          className={cn(
                            "object-cover transition-transform duration-700 group-hover:scale-105",
                            isOutOfStock && "grayscale-[30%]",
                          )}
                        />
                        {isOutOfStock && (
                          <span className="absolute bottom-3 left-3 text-[9px] font-semibold uppercase tracking-widest text-navy-900/60 sm:text-[10px]">
                            Sold Out
                          </span>
                        )}
                      </Link>

                      <div className="col-span-2 flex flex-col justify-between sm:col-span-3">
                        <div>
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <Link
                              href={productHref}
                              className="font-serif text-lg font-medium leading-snug text-navy-900 transition-colors hover:text-[#c5a059] sm:text-xl"
                            >
                              {item.productName || "Product"}
                            </Link>
                            <span className="shrink-0 font-serif text-lg font-medium text-navy-900 sm:text-xl">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                          {variantLine && (
                            <p className="mb-4 max-w-md text-sm leading-relaxed text-gray-600">
                              {variantLine}
                            </p>
                          )}

                          {item.customFieldAnswers &&
                            item.customFieldAnswers.length > 0 && (
                              <div className="mb-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {item.customFieldAnswers.map((ans, i) => {
                                  const isImage =
                                    typeof ans.value === "string" &&
                                    /^https?:\/\//.test(ans.value);
                                  return (
                                    <div
                                      key={i}
                                      className="border border-[#c5a059]/20 bg-[#fff8eb]/60 px-2.5 py-2"
                                    >
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#b45309]">
                                        {ans.label}
                                      </p>
                                      {isImage ? (
                                        <a
                                          href={ans.value}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="mt-1 inline-flex items-center gap-1"
                                        >
                                          <span className="relative h-9 w-9 overflow-hidden border border-[#c5a059]/30 bg-white">
                                            <Image
                                              src={ans.value}
                                              alt={ans.label}
                                              fill
                                              sizes="36px"
                                              className="object-cover"
                                            />
                                          </span>
                                          <span className="text-[10px] font-semibold text-[#c5a059]">
                                            View
                                          </span>
                                        </a>
                                      ) : (
                                        <p className="break-words text-xs font-medium text-gray-700">
                                          {ans.value}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          {isUnavailable && (
                            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                              {isOutOfStock
                                ? "This piece is sold out. Remove or save for later to continue."
                                : "This item is unavailable right now. Remove it to continue."}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <div className="flex items-center border border-gray-300 px-3 py-1.5 sm:px-4 sm:py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  item.quantity > minQty
                                    ? updateItem(
                                        item.cartItemId,
                                        item.quantity - 1,
                                      )
                                    : item.quantity === 1
                                      ? removeItem(item.cartItemId)
                                      : undefined
                                }
                                className="flex h-8 w-8 items-center justify-center text-navy-900 transition-colors hover:text-[#c5a059] disabled:opacity-40"
                                disabled={
                                  isLoading ||
                                  isOutOfStock ||
                                  item.quantity <= minQty
                                }
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[2.5rem] px-3 text-center text-xs font-semibold uppercase tracking-widest text-navy-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(
                                    item.cartItemId,
                                    item.quantity + 1,
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center text-navy-900 transition-colors hover:text-[#c5a059] disabled:opacity-40"
                                disabled={
                                  isLoading ||
                                  isOutOfStock ||
                                  exceedsCurrentStock ||
                                  item.quantity >=
                                    Math.min(
                                      99,
                                      Math.max(1, item.variant.stock ?? 99),
                                    )
                                }
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleSaveForLater(item)}
                              disabled={
                                isLoading || savingItemId === item.cartItemId
                              }
                              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c5a059] transition-all duration-300 hover:tracking-[0.2em] disabled:opacity-50 sm:text-[11px]"
                            >
                              <Heart className="h-3.5 w-3.5" />
                              {savingItemId === item.cartItemId
                                ? "Saving…"
                                : "Save for Later"}
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.cartItemId)}
                          disabled={isLoading}
                          className="mt-6 self-start text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-red-600 disabled:opacity-50 sm:text-[11px]"
                        >
                          Remove Item
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>

            <section className="relative mt-12 overflow-hidden border border-[#c5a059]/15 bg-[#f3f4f5] p-6 sm:mt-14 sm:p-8">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-3">
                  <Star
                    className="h-4 w-4 fill-[#c5a059] text-[#c5a059]"
                    aria-hidden
                  />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c5a059]">
                    Heritage Promise
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                  <div>
                    <p className="mb-1 text-sm font-medium text-navy-900">
                      Authenticity Guaranteed
                    </p>
                    <p className="text-sm leading-relaxed text-gray-600 opacity-90">
                      Each piece is crafted with verified artisanal techniques
                      and quality you can trust for generations.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-navy-900">
                      Thoughtful Care
                    </p>
                    <p className="text-sm leading-relaxed text-gray-600 opacity-90">
                      Complimentary guidance on preserving your sarees and
                      ethnic wear so they endure beautifully.
                    </p>
                  </div>
                </div>
              </div>
              <BadgeCheck
                className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-navy-900/[0.04] sm:h-48 sm:w-48"
                aria-hidden
              />
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <div className="border-t-4 border-[#c5a059] bg-navy-900 p-6 shadow-[0px_20px_40px_rgba(3,22,50,0.08)] sm:p-8 lg:p-10">
                <h2 className="mb-6 font-serif text-xl font-medium text-[#ffdea5] sm:mb-8 sm:text-2xl">
                  Order Summary
                </h2>

                <div className="mb-6 space-y-4 border-b border-white/10 pb-6 sm:mb-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Promotional Code
                  </p>

                  {cart.discount > 0 ? (
                    <div className="space-y-3 border border-[#c5a059]/35 bg-white p-3 shadow-sm sm:p-4">
                      <CouponAppliedBanner
                        variant="heritage"
                        code={appliedCouponCode}
                        savedAmount={cart.discount}
                        eligibleCoupons={eligibleCoupons}
                      />
                      <button
                        type="button"
                        className="w-full border border-gray-200 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500 transition-colors hover:border-[#c5a059]/50 hover:bg-[#fff8eb] hover:text-navy-900 disabled:opacity-50"
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
                        {couponLoading ? "Removing…" : "Remove Coupon"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) =>
                          setCouponInput(e.target.value.toUpperCase())
                        }
                        placeholder="Enter coupon code"
                        autoComplete="off"
                        className="h-10 min-w-0 flex-1 border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:border-[#c5a059]/60 focus:outline-none focus:ring-1 focus:ring-[#c5a059]/40"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyCoupon()
                        }
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="h-10 shrink-0 bg-[#c5a059] px-4 text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#b8924d] disabled:opacity-50"
                      >
                        {couponLoading ? "Applying…" : "Apply"}
                      </button>
                    </div>
                  )}

                  {eligibleCoupons.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setIsAllCouponsOpen(true)}
                      className="text-[10px] font-semibold uppercase tracking-widest text-[#ffdea5] hover:text-white"
                    >
                      View all offers
                    </button>
                  )}

                  <div className="space-y-2">
                    {isLoadingCoupons ? (
                      <p className="text-xs text-white/50">
                        Loading available offers…
                      </p>
                    ) : eligibleCoupons.length === 0 ? (
                      <p className="text-xs text-white/50">
                        No coupons are available for this cart.
                      </p>
                    ) : (
                      eligibleCoupons.slice(0, 2).map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          title={
                            cart.discount > 0
                              ? "Remove your current coupon to use another"
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
                            "w-full min-w-0 border border-[#c5a059]/25 bg-white p-3 text-left transition-all",
                            cart.discount > 0 || couponLoading
                              ? "cursor-not-allowed opacity-50"
                              : "hover:border-[#c5a059]/60 hover:bg-[#fff8eb]/80 hover:shadow-sm",
                          )}
                          disabled={couponLoading || cart.discount > 0}
                        >
                          <CouponOfferPreview coupon={c} />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="mb-8 space-y-4 sm:mb-10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-sm text-white/70">Subtotal</span>
                    <span className="text-sm text-white">
                      {formatPrice(cart.subtotal)}
                    </span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-sm text-[#ffdea5]/90">
                        Discount
                      </span>
                      <span className="text-sm text-[#ffdea5]">
                        − {formatPrice(cart.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-sm text-white/70">
                      Shipping &amp; Handling
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        shippingCharge === 0
                          ? "text-[#ffdea5]"
                          : "text-white",
                      )}
                    >
                      {shippingCharge === 0
                        ? "Complimentary"
                        : formatPrice(shippingCharge)}
                    </span>
                  </div>
                </div>

                <div className="mb-8 sm:mb-10">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffdea5]">
                    Total
                  </p>
                  <p className="font-serif text-3xl text-white sm:text-4xl">
                    {formatPrice(estimatedTotal)}
                  </p>
                </div>

                <button
                  ref={checkoutBtnRef}
                  type="button"
                  disabled={isCheckoutLaunching || hasUnavailableItems}
                  onClick={() => void goToCheckout()}
                  className="mb-4 w-full bg-[#c5a059] py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b8924d] disabled:cursor-not-allowed disabled:opacity-50 sm:py-5 max-lg:hidden"
                >
                  {isCheckoutLaunching
                    ? "Opening checkout…"
                    : "Proceed to Checkout"}
                </button>

                {hasUnavailableItems && (
                  <p className="mb-4 text-center text-[11px] font-medium text-red-300">
                    Remove sold-out items to proceed to checkout.
                  </p>
                )}

                <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-white/40">
                  <Shield className="h-3 w-3 shrink-0" aria-hidden />
                  Secured by industry-standard encryption
                </p>
              </div>

              <div className="mt-6 space-y-4 sm:mt-8">
                <div className="flex items-center gap-4 text-gray-600">
                  <Truck className="h-4 w-4 shrink-0 text-[#c5a059]" />
                  <span className="text-sm">
                    Delivery within 5–7 business days across India.
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <Undo2 className="h-4 w-4 shrink-0 text-[#c5a059]" />
                  <span className="text-sm">
                    Easy returns on eligible non-bespoke items.
                  </span>
                </div>
              </div>

              <p className="mt-6 text-center">
                <Link
                  href="/shop"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 transition-colors hover:text-[#c5a059]"
                >
                  Continue Shopping
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 p-4 lg:hidden pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          disabled={isCheckoutLaunching || hasUnavailableItems}
          onClick={() => {
            if (checkoutBtnRef.current) checkoutBtnRef.current.click();
            else goToCheckout();
          }}
          className="w-full bg-[#c5a059] py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b8924d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCheckoutLaunching ? "Opening checkout…" : "Proceed to Checkout"}
        </button>
      </div>

      {isAllCouponsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => setIsAllCouponsOpen(false)}
            aria-hidden
          />
          <div className="relative max-h-[80vh] w-full overflow-hidden bg-white shadow-2xl sm:max-w-lg sm:rounded-sm">
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-gray-100 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Promotional Codes
                </p>
                <h3 className="truncate font-serif text-lg font-medium text-navy-900">
                  Available for your cart
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAllCouponsOpen(false)}
                className="flex h-9 w-9 items-center justify-center bg-gray-100 hover:bg-gray-200"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="min-w-0 space-y-2 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
              {eligibleCoupons.map((c) => (
                <button
                  key={c._id}
                  type="button"
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
                    "w-full min-w-0 border border-gray-200 p-3 text-left transition-all",
                    cart.discount > 0 || couponLoading
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-[#c5a059]/50 hover:bg-[#fff8eb]/50",
                  )}
                  disabled={couponLoading || cart.discount > 0}
                >
                  <CouponOfferPreview coupon={c} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
