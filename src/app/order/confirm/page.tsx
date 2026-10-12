import { Suspense } from "react";
import GuestOrderConfirmClient from "@/components/order/GuestOrderConfirmClient";

export default function GuestOrderConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-[40vh] items-center justify-center text-sm text-gray-600'>
          Loading…
        </div>
      }
    >
      <GuestOrderConfirmClient />
    </Suspense>
  );
}
