"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { META_PIXEL_ID, initPixel, trackPageView } from "@/lib/metaPixel";

export default function MetaPixel() {
  const pathname = usePathname();
  const skipFirstPathEffect = useRef(true);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (skipFirstPathEffect.current) {
      skipFirstPathEffect.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  if (!META_PIXEL_ID) {
    return null;
  }

  return (
    <>
      <Script
        id="facebook-fbevents"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
        onLoad={() => {
          initPixel();
          trackPageView();
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
