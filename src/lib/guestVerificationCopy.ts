/** Shared guest checkout — order confirmation & contact verification via email link (Yes / No). */

export const guestVerificationCopy = {
  statusPending: "Order confirmation pending",
  statusPendingSub:
    "Please complete order confirmation and contact verification using the secure link in your email.",
  checkEmailHeadline: "Check your email",
  resendButton: "Resend confirmation email",
  resendHint:
    "If you do not see the message within a few minutes, check spam or promotions, then resend the confirmation email.",
  overlayDescription:
    "Your order is received. We are sending a secure link to your email to confirm the order and verify your contact details. The next screen shows your order summary and options to resend the email.",
  overlayStatusLabel: "Opening order summary",
  bannerTitle: "Confirm your order to stay updated",
  bannerBody: (email: string) =>
    `We sent an order confirmation and verification email to ${email}. Open it, follow the secure link, and select Yes or No to confirm whether you placed this order. You may then create a password for future visits.`,
  bannerCta: "Order summary · resend email",
  bannerInboxFallback:
    'Look for the email “Verify your order”, or open your order summary to resend the confirmation message.',
  bannerLoggedOutGuest:
    "New guest? Complete order confirmation from the email we sent (Yes or No), then you may create a password.",
  signupBody: (email: string) =>
    `Before setting a password, complete order confirmation in the email we sent to ${email}. Use the secure link to verify your contact details and select Yes or No. No signup code is required.`,
  signupCta: "Order summary · resend email",
  postCheckoutBody: (email: string) =>
    `Thank you for your order. We have sent order confirmation and verification to ${email}. Open that email and use the secure link to verify your details and confirm whether you placed this order.`,
  emailLinkIntro: (orderNumber: string) =>
    `Order ${orderNumber}: please review your contact details below. Select Yes to confirm that you placed this order and that your email and phone are correct. Select No if you did not place this order.`,
  confirmYes: "Yes, I placed this order",
  confirmNo: "No, this was not me",
  toastResendQueued:
    "Confirmation email queued. Please check your inbox and open the secure link to complete verification.",
  toastResendSent:
    "Confirmation email sent. Open the link in your email to confirm your order (Yes or No).",
  toastConfirmYes:
    "Thank you. Your order is confirmed and your contact details are verified.",
  toastConfirmNo:
    "Thank you. We have recorded that you did not place this order.",
  emailSentAt: (when: string) =>
    `Order confirmation email sent ${when}.`,
  emailNotSentYet:
    "Your order confirmation email will arrive shortly at the address below.",
  pageEyebrow: "Order confirmation & verification",
  confirmedTitle: "Order confirmed & verified",
  confirmedBody:
    "Your contact details are verified. Create a password to track this order and shop faster next time — no email code required.",
  createPasswordCta: "Create password",
  viewOrderCta: "View order",
  declinedTitle: "Response recorded",
  declinedBody:
    "You indicated that you did not place this order. Our team may contact you if we need to verify anything. If this was a mistake, contact support with your order number.",
  steps: [
    { id: 1, label: "Order received" },
    { id: 2, label: "Open confirmation email" },
    { id: 3, label: "Confirm & verify" },
  ] as const,
};

export function guestConfirmStatusPath(token: string): string {
  return `/order/confirm?token=${encodeURIComponent(token.trim())}`;
}

/** Full-page password step (e.g. after email verify on /order/confirm). */
export function buildGuestSignupPageHref(opts: {
  email: string;
  redirectPath?: string;
}): string {
  const params = new URLSearchParams({
    email: opts.email.trim().toLowerCase(),
    redirect: opts.redirectPath || "/dashboard/orders",
    guestFinish: "1",
  });
  return `/auth/signup?${params.toString()}`;
}

/** @deprecated Use buildGuestSignupPageHref or openGuestPasswordModalUrl */
export function buildGuestSignupHref(opts: {
  email: string;
  redirectPath?: string;
}): string {
  return buildGuestSignupPageHref(opts);
}
